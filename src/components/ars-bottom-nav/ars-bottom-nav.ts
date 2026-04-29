// <ars-bottom-nav> — A mobile-optimized bottom tab navigation bar.
//
// Attributes:
//   value — the value of the currently active item
//
// Slots:
//   default — ars-bottom-nav-item children
//
// Events:
//   ars-bottom-nav:change — composed CustomEvent when value changes
//
// Children:
//   <ars-bottom-nav-item value="..."> with optional icon slot and label slot

export type ArsBottomNavValue = string;

class ArsBottomNav extends HTMLElement {
  static get observedAttributes() {
    return ["value"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open", delegatesFocus: true });
  }

  connectedCallback() {
    this.#render();
    this.#bindEvents();
    this.#syncActive();
  }

  attributeChangedCallback(name: string, _old: string | null, newValue: string | null) {
    if (this.shadowRoot && name === "value") {
      this.#syncActive();
      this.dispatchEvent(
        new CustomEvent("ars-bottom-nav:change", {
          bubbles: true,
          composed: true,
          detail: { value: newValue ?? "" },
        }),
      );
    }
  }

  // --- Property accessors ---

  get value(): ArsBottomNavValue {
    return this.getAttribute("value") ?? "";
  }

  set value(v: ArsBottomNavValue) {
    this.setAttribute("value", v);
  }

  // --- Private ---

  #render() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>${ArsBottomNav.#styles()}</style>
      <nav part="nav" class="nav" role="tablist" aria-orientation="horizontal">
        <slot></slot>
      </nav>
    `;
  }

  #bindEvents() {
    if (!this.shadowRoot) return;

    // Listen for clicks on ars-bottom-nav-item elements in the light DOM
    this.addEventListener("ars-bottom-nav-item:select", (e) => {
      const itemValue = (e as CustomEvent).detail?.value;
      if (itemValue !== undefined) {
        this.value = itemValue;
      }
    });
  }

  #syncActive() {
    const currentValue = this.value;
    const items = Array.from(this.querySelectorAll<ArsBottomNavItem>("ars-bottom-nav-item"));
    for (const item of items) {
      item.setAttribute("active", item.value === currentValue ? "" : "false");
    }
  }

  static #styles(): string {
    return `
      :host {
        display: block;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
        position: relative;
      }

      .nav {
        display: flex;
        align-items: stretch;
        justify-content: space-around;
        width: 100%;
        background: var(--arswc-color-surface, #ffffff);
        border-top: 1px solid var(--arswc-color-border, #d5dde8);
        box-shadow: 0 -1px 4px rgba(0,0,0,0.04);
        height: 56px;
        padding: 0;
        margin: 0;
      }
    `;
  }
}

// ---------------------------------------------------------------------------
// <ars-bottom-nav-item>
// ---------------------------------------------------------------------------

class ArsBottomNavItem extends HTMLElement {
  static get observedAttributes() {
    return ["value", "active"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open", delegatesFocus: true });
  }

  connectedCallback() {
    this.#render();
    this.#bindEvents();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this.#render();
      this.#bindEvents();
    }
  }

  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(v: string) {
    this.setAttribute("value", v);
  }

  get active(): boolean {
    return this.getAttribute("active") !== "false" && this.hasAttribute("active");
  }

  set active(v: boolean) {
    if (v) {
      this.setAttribute("active", "");
    } else {
      this.setAttribute("active", "false");
    }
  }

  #render() {
    if (!this.shadowRoot) return;
    const isActive = this.active;
    this.shadowRoot.innerHTML = `
      <style>${ArsBottomNavItem.#styles()}</style>
      <button
        part="item"
        class="item${isActive ? " item--active" : ""}"
        type="button"
        role="tab"
        aria-selected="${String(isActive)}"
      >
        <span class="icon" part="icon"><slot name="icon"></slot></span>
        <span class="label" part="label"><slot></slot></span>
      </button>
    `;
  }

  #bindEvents() {
    if (!this.shadowRoot) return;
    const btn = this.shadowRoot.querySelector("button");
    if (!btn) return;

    btn.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("ars-bottom-nav-item:select", {
          bubbles: true,
          composed: true,
          detail: { value: this.value },
        }),
      );
    });
  }

  static #styles(): string {
    return `
      :host {
        display: flex;
        flex: 1;
        font-family: inherit;
      }

      .item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        width: 100%;
        height: 100%;
        border: none;
        background: transparent;
        cursor: pointer;
        font-family: inherit;
        padding: 4px 0;
        color: var(--arswc-color-text-muted, #4d5563);
        transition: color var(--arswc-transition-duration, 200ms) ease;
        position: relative;
      }

      .item:focus-visible {
        outline: none;
        background: var(--arswc-color-surface, #f6f8fb);
        border-radius: var(--arswc-radius-md, 10px);
      }

      .item:active {
        opacity: 0.7;
      }

      .item--active {
        color: var(--arswc-color-accent, #2563eb);
      }

      .item--active::after {
        content: "";
        position: absolute;
        bottom: 4px;
        width: 20px;
        height: 3px;
        border-radius: 2px;
        background: var(--arswc-color-accent, #2563eb);
      }

      .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        width: 24px;
        height: 24px;
      }

      .label {
        font-size: 0.7rem;
        font-weight: 600;
        line-height: 1;
      }
    `;
  }
}

if (typeof customElements !== "undefined") {
  if (!customElements.get("ars-bottom-nav")) {
    customElements.define("ars-bottom-nav", ArsBottomNav);
  }
  if (!customElements.get("ars-bottom-nav-item")) {
    customElements.define("ars-bottom-nav-item", ArsBottomNavItem);
  }
}

export { ArsBottomNav, ArsBottomNavItem, ArsBottomNav as default, ArsBottomNavItem as defaultItem };
