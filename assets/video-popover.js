/**
 * A custom element that plays a video tile's video in a modal <dialog>.
 *
 * Rendered once per sections/video-carousel.liquid. Tiles (snippets/video-tile.liquid) carry a
 * `[data-video-popover-open]` button and a <template class="video-tile__media"> holding the
 * <video> or <iframe>. Nothing in a template downloads until it is cloned here, and the clone
 * is removed again on close, so only one video ever exists (and plays) at a time.
 */
export class VideoPopover extends HTMLElement {
  /** @type {HTMLDialogElement | null} */
  #dialog = null;
  /** @type {HTMLElement | null} */
  #frame = null;
  /** @type {HTMLElement | null} */
  #root = null;
  /** @type {HTMLElement | null} */
  #opener = null;
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
  }

  disconnectedCallback() {
    this.#root?.removeEventListener('pointerdown', this.#onPointerDown);
    this.#root?.removeEventListener('pointermove', this.#onPointerMove);
    this.#root?.removeEventListener('click', this.#onRootClick);
    this.#dialog?.removeEventListener('click', this.#onDialogClick);
    this.#dialog?.removeEventListener('close', this.#onClose);
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

  /** Clicks on the dialog element itself (not the frame or close button) are backdrop clicks. */
  /** @param {MouseEvent} event */
  #onDialogClick = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target === this.#dialog || target?.closest('[data-video-popover-close]')) this.close();
  };

  /**
   * Opens the popover with the video of the tile the button belongs to.
   * @param {HTMLElement} button - The tile button that was activated.
   */
  open(button) {
    const dialog = this.#dialog;
    const frame = this.#frame;
    const template = button.closest('.video-tile')?.querySelector('template.video-tile__media');
    if (!dialog || !frame || !(template instanceof HTMLTemplateElement) || dialog.open) return;

    this.#opener = button;
    frame.replaceChildren(template.content.cloneNode(true));

    this.#lockScroll();
    dialog.showModal();
    /** @type {HTMLElement | null} */ (dialog.querySelector('.video-popover__close'))?.focus();

    const video = frame.querySelector('video');
    if (video) {
      video.muted = false;
      // The click is a user gesture, so playing with sound is allowed. Controls stay available
      // if the browser still refuses.
      video.play().catch(() => {});
    }
  }

  close() {
    if (this.#dialog?.open) this.#dialog.close();
  }

  /** Runs for every way the dialog closes: close button, Esc, backdrop, or close(). */
  #onClose = () => {
    const frame = this.#frame;
    if (frame) {
      frame.querySelectorAll('video').forEach((video) => {
        video.pause();
        video.removeAttribute('src');
        video.querySelectorAll('source').forEach((source) => source.remove());
        video.load();
      });
      frame.replaceChildren();
    }

    this.#unlockScroll();
    this.#opener?.focus({ preventScroll: true });
    this.#opener = null;
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
