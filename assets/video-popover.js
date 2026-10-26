/**
 * A custom element that plays a video tile's video in a modal <dialog>.
 *
 * Rendered once per sections/video-carousel.liquid. Tiles (snippets/video-tile.liquid) carry a
 * `[data-video-popover-open]` button and a <template class="video-tile__media"> holding the
 * <video> or <iframe>. Nothing in a template downloads until it is cloned here, and the clone
 * is removed again on close, so only one video ever exists (and plays) at a time.
 *
 * Previous / next buttons (and the arrow keys) swap the video in place, wrapping around at the
 * ends. The section renders every tile twice (a desktop copy and a mobile copy, one hidden), so
 * the playlist is the copy the opening tile belongs to: each video once, in block order.
 */
export class VideoPopover extends HTMLElement {
  /** @type {HTMLDialogElement | null} */
  #dialog = null;
  /** @type {HTMLElement | null} */
  #frame = null;
  /** @type {HTMLElement | null} */
  #root = null;
  /** The tile button of the video currently shown; focus returns to it on close. */
  /** @type {HTMLElement | null} */
  #opener = null;
  /** Tile buttons of the copy that opened the popover, in block order. */
  /** @type {HTMLElement[]} */
  #items = [];
  #index = 0;
  /** @type {{ x: number, y: number } | null} */
  #pointerStart = null;
  #movedTooFar = false;
  #previousOverflow = '';

  connectedCallback() {
    this.#dialog = this.querySelector('dialog');
    this.#frame = this.querySelector('.video-popover__frame');
    this.#root = this.closest('.video-carousel') ?? this.parentElement;
    if (!this.#dialog || !this.#root) return;

    this.#root.addEventListener('pointerdown', this.#onPointerDown);
    this.#root.addEventListener('pointermove', this.#onPointerMove);
    this.#root.addEventListener('click', this.#onRootClick);
    this.#dialog.addEventListener('click', this.#onDialogClick);
    this.#dialog.addEventListener('close', this.#onClose);
    this.#dialog.addEventListener('keydown', this.#onKeyDown);
  }

  disconnectedCallback() {
    this.#root?.removeEventListener('pointerdown', this.#onPointerDown);
    this.#root?.removeEventListener('pointermove', this.#onPointerMove);
    this.#root?.removeEventListener('click', this.#onRootClick);
    this.#dialog?.removeEventListener('click', this.#onDialogClick);
    this.#dialog?.removeEventListener('close', this.#onClose);
    this.#dialog?.removeEventListener('keydown', this.#onKeyDown);
    this.#unlockScroll();
  }

  /** @param {PointerEvent} event */
  #onPointerDown = (event) => {
    this.#pointerStart = { x: event.clientX, y: event.clientY };
    this.#movedTooFar = false;
  };

  /** A drag or swipe across a tile is not a tap: ignore the click that may follow it. */
  /** @param {PointerEvent} event */
  #onPointerMove = (event) => {
    if (!this.#pointerStart) return;
    if (Math.hypot(event.clientX - this.#pointerStart.x, event.clientY - this.#pointerStart.y) > 8) {
      this.#movedTooFar = true;
    }
  };

  /** @param {MouseEvent} event */
  #onRootClick = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('[data-video-popover-open]');
    if (!(button instanceof HTMLElement)) return;

    // detail is 0 for a keyboard-activated click, which is never the tail of a swipe.
    if (this.#movedTooFar && event.detail !== 0) {
      this.#movedTooFar = false;
      return;
    }

    this.open(button);
  };

  /** Clicks on the dialog element itself or the empty space of the nav row (not the frame or buttons) are backdrop clicks. */
  /** @param {MouseEvent} event */
  #onDialogClick = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target === this.#dialog || target?.matches('.video-popover__nav-row') || target?.closest('[data-video-popover-close]')) this.close();
    else if (target?.closest('[data-video-popover-previous]')) this.step(-1);
    else if (target?.closest('[data-video-popover-next]')) this.step(1);
  };

  /** Arrow keys move between videos, except while focus is on the video itself (its controls seek with them). */
  /** @param {KeyboardEvent} event */
  #onKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target instanceof HTMLVideoElement || event.target instanceof HTMLIFrameElement) return;
    event.preventDefault();
    this.step(event.key === 'ArrowRight' ? 1 : -1);
  };

  /**
   * Opens the popover with the video of the tile the button belongs to.
   * @param {HTMLElement} button - The tile button that was activated.
   */
  open(button) {
    const dialog = this.#dialog;
    if (!dialog || !this.#frame || dialog.open) return;
    if (!(button.closest('.video-tile')?.querySelector('template.video-tile__media') instanceof HTMLTemplateElement)) return;

    const container = button.closest('.video-carousel__desktop-grid, .video-carousel__desktop, .video-carousel__mobile') ?? this.#root;
    const items = /** @type {HTMLElement[]} */ ([...(container?.querySelectorAll('[data-video-popover-open]') ?? [])]);
    this.#items = items.includes(button) ? items : [button];
    this.#index = this.#items.indexOf(button);

    dialog.querySelectorAll('[data-video-popover-previous], [data-video-popover-next]').forEach((control) => {
      /** @type {HTMLElement} */ (control).hidden = this.#items.length < 2;
    });

    this.#lockScroll();
    dialog.showModal();
    /** @type {HTMLElement | null} */ (dialog.querySelector('.video-popover__close'))?.focus();
    this.#show();
  }

  /**
   * Swaps the video in place, wrapping around at the ends.
   * @param {number} direction - 1 for next, -1 for previous.
   */
  step(direction) {
    if (!this.#dialog?.open || this.#items.length < 2) return;
    this.#index = (this.#index + direction + this.#items.length) % this.#items.length;
    this.#show();
  }

  /** Unloads whatever is in the frame, then clones in the current tile's video and plays it with sound. */
  #show() {
    const frame = this.#frame;
    const button = this.#items[this.#index];
    const template = button?.closest('.video-tile')?.querySelector('template.video-tile__media');
    if (!frame || !(template instanceof HTMLTemplateElement)) return;

    this.#unloadMedia();
    this.#opener = button;
    frame.replaceChildren(template.content.cloneNode(true));

    const video = frame.querySelector('video');
    if (video) {
      video.muted = false;
      // The click or key press is a user gesture, so playing with sound is allowed. Controls stay
      // available if the browser still refuses.
      video.play().catch(() => {});
    }
  }

  #unloadMedia() {
    const frame = this.#frame;
    if (!frame) return;
    frame.querySelectorAll('video').forEach((video) => {
      video.pause();
      video.removeAttribute('src');
      video.querySelectorAll('source').forEach((source) => source.remove());
      video.load();
    });
    frame.replaceChildren();
  }

  close() {
    if (this.#dialog?.open) this.#dialog.close();
  }

  /** Runs for every way the dialog closes: close button, Esc, backdrop, or close(). */
  #onClose = () => {
    this.#unloadMedia();
    this.#unlockScroll();
    this.#opener?.focus({ preventScroll: true });
    this.#opener = null;
    this.#items = [];
  };

  #lockScroll() {
    this.#previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
  }

  #unlockScroll() {
    document.documentElement.style.overflow = this.#previousOverflow;
  }
}

if (!customElements.get('video-popover')) {
  customElements.define('video-popover', VideoPopover);
}
