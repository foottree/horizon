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
    // exact edge, not rounded: a fraction of a pixel of overlap lets the dimming backdrop
    // darken the header's bottom border on 2x/3x phone screens
    const bottom = Math.max(0, Number(header.getBoundingClientRect().bottom.toFixed(2)));
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
 * Policy pages: give the breadcrumb back its semantics.
 *
 * /policies/* is the one storefront page with no theme template, so sections/breadcrumb.liquid
 * cannot be rendered into it and the crumbs are hand-written at the top of the policy body that
 * Settings > Policies stores (see the "Policy pages" block in custom.css). Shopify sanitises that
 * body on the way to the page: class survives, but <nav>, role, aria-* and data-* are stripped,
 * so a stored <nav aria-label="Breadcrumb"> with aria-current="page" arrives as a bare <ol> and
 * the landmark is lost.
 *
 * The crumbs are styled entirely off .ftp-crumbs and read correctly with or without this, so this
 * only adds what CSS cannot: the navigation landmark, its name, and the current-page marker.
 * role="navigation" + aria-label is the same accessibility node a <nav aria-label> produces, and
 * setting attributes avoids moving anything in the DOM after the page has painted.
 */
(() => {
  const crumbs = document.querySelector('.shopify-policy__body .ftp-crumbs');
  if (!crumbs) return;
  if (!crumbs.closest('nav') && !crumbs.hasAttribute('role')) {
    crumbs.setAttribute('role', 'navigation');
    crumbs.setAttribute('aria-label', 'Breadcrumb');
  }
  crumbs.querySelector('.ftp-crumbs__current')?.setAttribute('aria-current', 'page');
})();

