/**
 * <size-chart>: the Women's / Men's switch of snippets/size-chart.liquid.
 *
 * A plain element, not a Horizon Component: it has no refs and must never wrap markup that
 * does (a wrapping component hides the variant picker's refs, see snippets/size-guide-dialog.liquid).
 * Click selects a tab; Left/Right/Home/End move between tabs.
 */
class SizeChart extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeyDown);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeyDown);
  }

  /** @returns {HTMLElement[]} */
  get tabs() {
    return Array.from(this.querySelectorAll('[role="tab"]'));
  }

  /**
   * @param {HTMLElement} selected
   * @param {boolean} [focus]
   */
  select(selected, focus = false) {
    for (const tab of this.tabs) {
      const isSelected = tab === selected;
      tab.setAttribute('aria-selected', String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
      // The selected tab uses the site's primary button, the other the secondary one
      tab.classList.toggle('button', isSelected);
      tab.classList.toggle('button-secondary', !isSelected);

      const panel = this.querySelector(`#${CSS.escape(tab.getAttribute('aria-controls') ?? '')}`);
      if (panel) panel.hidden = !isSelected;
    }

    if (focus) selected.focus();
  }

  #onClick = (/** @type {MouseEvent} */ event) => {
    const tab = event.target instanceof Element ? event.target.closest('[role="tab"]') : null;
    if (tab instanceof HTMLElement && this.contains(tab)) this.select(tab);
  };

  #onKeyDown = (/** @type {KeyboardEvent} */ event) => {
    const tab = event.target instanceof Element ? event.target.closest('[role="tab"]') : null;
    if (!(tab instanceof HTMLElement)) return;

    const tabs = this.tabs;
    const index = tabs.indexOf(tab);
    let next = -1;

    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;

    if (next === -1) return;

    event.preventDefault();
    this.select(tabs[next], true);
  };
}

if (!customElements.get('size-chart')) customElements.define('size-chart', SizeChart);
