// <ars-list> — A list container with optional selection support.
//
// Used by the engine's DomAdapter to render lists of items.  Items are
// expected to be child elements (typically <ars-button>, <span>, or
// other inline elements) in the light DOM.
//
// Attributes:
//   selectable — boolean, enables item selection
//
// Events:
//   ars-list:select — fired when an item is clicked while selectable.
//                     detail: { index: number, item: HTMLElement }

class ArsList extends HTMLElement {
  static get observedAttributes() {
    return ["selectable"];
  }

  #selectedIndex = -1;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#bindEvents();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this.#render();
    }
  }

  get selectable(): boolean {
    return this.hasAttribute("selectable");
  }

  set selectable(value: boolean) {
    this.toggleAttribute("selectable", value);
  }

  get selectedIndex(): number {
    return this.#selectedIndex;
  }

  #render() {
    if (!this.shadowRoot) return;
    const selectable = this.selectable;
    this.shadowRoot.innerHTML = `
      <style>${ArsList.#styles()}</style>
      <div class="list${selectable ? ' list--selectable' : ''}" part="list" role="list">
        <slot></slot>
      </div>
    `;
  }

  #bindEvents() {
    this.addEventListener("click", (e) => {
      if (!this.selectable) return;
      const slot = this.shadowRoot?.querySelector("slot");
      if (!slot) return;
      const items = slot.assignedElements();
      const target = e.target as HTMLElement;
      const item = target.closest("[slot]") ?? target;
      const index = items.indexOf(item);
      if (index >= 0) {
        this.#selectedIndex = index;
        this.dispatchEvent(
          new CustomEvent("ars-list:select", {
            bubbles: true,
            composed: true,
            detail: { index, item },
          })
        );
      }
    });
  }

  static #styles(): string {
    return `
      :host { display: block; }
      .list {
        display: flex;
        flex-direction: column;
        gap: var(--arsds-spacing-xs, 0.25rem);
        padding: var(--arsds-spacing-xs, 0.25rem) 0;
      }
      .list--selectable ::slotted(*) {
        cursor: pointer;
        user-select: none;
      }
      .list--selectable ::slotted(*:hover) {
        background: var(--arsds-color-surface-hover, rgba(0,0,0,0.04));
      }
    `;
  }
}

export { ArsList };
