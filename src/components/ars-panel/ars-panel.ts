// <ars-panel> — A surface container with optional padding and background.
//
// Used by the engine's DomAdapter as the default container for world-space
// and screen-space UI panels.  Children are rendered in the light DOM so
// the DomAdapter can append / remove them directly.
//
// Attributes:
//   padding   — "none" | "sm" | "md" | "lg" | "xl" (default "md")
//   elevated  — boolean, adds a shadow
//
// Slots:
//   default — all child content

class ArsPanel extends HTMLElement {
  static get observedAttributes() {
    return ["padding", "elevated"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this.#render();
    }
  }

  get padding(): string {
    return this.getAttribute("padding") || "md";
  }

  set padding(value: string) {
    this.setAttribute("padding", value);
  }

  get elevated(): boolean {
    return this.hasAttribute("elevated");
  }

  set elevated(value: boolean) {
    this.toggleAttribute("elevated", value);
  }

  #render() {
    if (!this.shadowRoot) return;
    const padding = this.padding;
    const elevated = this.elevated;
    this.shadowRoot.innerHTML = `
      <style>${ArsPanel.#styles()}</style>
      <div class="panel panel--padding-${padding}${elevated ? ' panel--elevated' : ''}" part="panel">
        <slot></slot>
      </div>
    `;
  }

  static #styles(): string {
    return `
      :host { display: block; }
      .panel {
        box-sizing: border-box;
        background: var(--arsds-color-surface, #fff);
        border: 1px solid var(--arsds-color-border, #e0e0e0);
        border-radius: var(--arsds-radius-md, 8px);
        overflow: hidden;
      }
      .panel--padding-none { padding: 0; }
      .panel--padding-sm   { padding: var(--arsds-spacing-sm, 0.5rem); }
      .panel--padding-md   { padding: var(--arsds-spacing-md, 1rem); }
      .panel--padding-lg   { padding: var(--arsds-spacing-lg, 1.5rem); }
      .panel--padding-xl   { padding: var(--arsds-spacing-xl, 2rem); }
      .panel--elevated {
        box-shadow: var(--arsds-shadow-md, 0 4px 12px rgba(0,0,0,0.1));
      }
    `;
  }
}

window.customElements.define("ars-panel", ArsPanel);

export { ArsPanel };
