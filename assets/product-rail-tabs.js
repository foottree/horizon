import { Component } from '@theme/component';

/**
 * Tabbed product rail: a small tablist that swaps which product carousel panel is visible.
 * Click activates a tab immediately; arrow keys move focus and activate the same way (no
 * auto-rotation - only user interaction switches tabs). Panels toggle via the `hidden`
 * attribute; the nested `slideshow-component`s already recompute their own slide width and
 * progress bar through their native `ResizeObserver` the moment a hidden (zero-size) panel
 * becomes visible again, so no manual resize/measure call is needed here.
 *
 * @typedef {Object} Refs
 * @property {HTMLElement[]} tabs
 * @property {HTMLElement[]} panels
 *
 * @extends {Component<Refs>}
 */
class ProductRailTabs extends Component {
  /**
   * Activates the tab (and its panel) at `index`.
   *
   * @param {number} index
   */
  selectTab(index) {
    const { tabs, panels } = this.refs;
    if (!Array.isArray(tabs) || !Array.isArray(panels)) return;

    const targetIndex = Number(index);
    if (Number.isNaN(targetIndex) || !tabs[targetIndex]) return;

    tabs.forEach((tab, i) => {
      const selected = i === targetIndex;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
    });

    panels.forEach((panel, i) => {
      panel.hidden = i !== targetIndex;
    });

    this.updateNavArrows(targetIndex);
  }

  /**
   * The header nav arrows (sections/product-rail-tabs.liquid's `.product-rail-tabs__nav`,
   * copied from sections/video-carousel.liquid's own header arrows) are shared by every tab -
   * there's only one arrow pair, sitting in the section header, not one per panel - so they
   * have to be re-pointed at whichever tab's carousel is now active, and hidden outright when
   * that tab renders as a contained grid with nothing to scroll (see is_desktop_grid in the
   * Liquid). The active tab BUTTON carries a `data-carousel-nav-id` attribute set by Liquid
   * (blank for a grid tab) naming the DOM id of that tab's `<slideshow-component>`; `on:click`
   * is read fresh off the button on every click (see assets/component.js), so rewriting the
   * attribute here is enough to retarget it - no need to touch the slideshow itself.
   *
   * @param {number} index
   */
  updateNavArrows(index) {
    const { tabs } = this.refs;
    if (!Array.isArray(tabs) || !tabs[index]) return;

    const navId = this.dataset.navId;
    if (!navId) return;

    const nav = document.getElementById(navId);
    if (!nav) return;

    const slideshowId = tabs[index].dataset.carouselNavId;

    if (!slideshowId) {
      nav.hidden = true;
      return;
    }

    nav.hidden = false;

    const previous = nav.querySelector('.product-rail-tabs__nav-arrow--previous');
    const next = nav.querySelector('.product-rail-tabs__nav-arrow--next');

    previous?.setAttribute('on:click', `#${slideshowId}/previous`);
    next?.setAttribute('on:click', `#${slideshowId}/next`);
  }

  /**
   * Arrow-key navigation between tabs (roving tabindex). Home/End jump to the first/last
   * tab; other keys are left alone.
   *
   * @param {KeyboardEvent} event
   */
  handleKeydown(event) {
    const { tabs } = this.refs;
    if (!Array.isArray(tabs) || tabs.length === 0) return;

    const currentIndex = tabs.indexOf(/** @type {HTMLElement} */ (event.target));
    if (currentIndex === -1) return;

    let newIndex;
    switch (event.key) {
      case 'ArrowRight':
        newIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.selectTab(newIndex);
    tabs[newIndex]?.focus();
  }
}

if (!customElements.get('product-rail-tabs')) {
  customElements.define('product-rail-tabs', ProductRailTabs);
}
