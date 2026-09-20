/*
 * Custom theme JavaScript.
 * Loaded on every page as a deferred classic script (see snippets/scripts.liquid),
 * so it runs after the DOM is parsed. Keep store-specific behaviour here rather than
 * editing the theme's own assets, so upstream Horizon updates merge cleanly.
 */

/*
 * Mobile menu drawer: keep --ft-drawer-top equal to the header's rendered bottom edge so the
 * drawer (custom.css) opens directly under the visible header, whether or not the announcement
 * bar has scrolled away. Updated on scroll/resize while closed, so opening never jumps.
 */
(() => {
  const header = document.getElementById('header-component');
  const details = document.getElementById('Details-menu-drawer-container');
  if (!header || !details) return;
  let raf = null;
  const update = () => {
    raf = null;
    const bottom = Math.max(0, Math.round(header.getBoundingClientRect().bottom));
    details.style.setProperty('--ft-drawer-top', `${bottom}px`);
  };
  const schedule = () => {
    if (raf === null) raf = requestAnimationFrame(update);
  };
  update();
  document.addEventListener('scroll', schedule, { passive: true, capture: true });
  window.addEventListener('resize', schedule);
  details.querySelector('summary')?.addEventListener('pointerdown', update, true);
  // The header stays visible while the drawer is open, so its burger (now an X) is tappable.
  // A tap there would fire the browser's native <details> toggle, which snaps the panel shut
  // with no transition and leaves the component out of sync; route it through Horizon's own
  // close() instead, which animates out and then resets the details element.
  details.querySelector('summary')?.addEventListener(
    'click',
    (event) => {
      if (details.open) event.preventDefault();
    },
    true
  );
  details.addEventListener('toggle', update);
})();

/*
 * Tabbed mega menu panel (assets/custom.css "Header mega menu: tabbed & grid", rail markup
 * from snippets/mega-menu-tabbed.liquid): hovering a rail item swaps the active card panel,
 * and moving focus to one (keyboard) does the same. Delegated on the document instead of
 * bound per item, so it keeps working after the header menu's content is replaced by the
 * Section Rendering API. `pointerover` (rather than `mouseenter`, which doesn't bubble) plus
 * the `is-active` guard gives the same "fires once on entry" behaviour as a mouseenter listener.
 */
(() => {
  /** @param {HTMLElement} rail */
  const activateRail = (rail) => {
    const targetId = rail.dataset.ftRailTarget;
    const railList = rail.closest('.ft-tabbed__rail');
    const panels = rail.closest('.ft-tabbed')?.querySelector('.ft-tabbed__panels');
    if (!targetId || !railList || !panels) return;

    railList.querySelectorAll('.ft-tabbed__rail-item.is-active').forEach((item) => {
      item.classList.remove('is-active');
      item.setAttribute('aria-current', 'false');
    });
    rail.classList.add('is-active');
    rail.setAttribute('aria-current', 'true');

    panels.querySelectorAll('.ft-tabbed__panel.is-active').forEach((panel) => panel.classList.remove('is-active'));
    const target = panels.querySelector(`#${CSS.escape(targetId)}`);
    target?.classList.add('is-active');
  };

  /** @param {Event} event */
  const onRailEnter = (event) => {
    if (!(event.target instanceof Element)) return;
    const rail = event.target.closest('[data-ft-rail]');
    if (!(rail instanceof HTMLElement) || rail.classList.contains('is-active')) return;
    activateRail(rail);
  };

  document.addEventListener('pointerover', onRailEnter, true);
  document.addEventListener('focusin', onRailEnter, true);
})();
