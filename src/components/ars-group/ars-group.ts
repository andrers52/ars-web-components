// <ars-group> — A flex container with direction and gap support.
//
// Used by the engine's DomAdapter to lay out child elements in a row
// or column.  Children live in the light DOM so the DomAdapter can
// reparent them freely.
//
// Attributes:
//   direction — "row" | "column" | "none" (default "column")
//   gap       — CSS gap value, e.g. "8px" or "var(--arsds-spacing-md)"
//
// Slots:
//   default — all child content

class ArsGroup extends HTMLElement {
  static get observedAttributes() {
    return ["direction", "gap"];
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

  get direction(): string {
    return this.getAttribute("direction") || "column";
  }

  set direction(value: string) {
    this.setAttribute("direction", value);
  }

  get gap(): string {
    return this.getAttribute("gap") || "";
  }

  set gap(value: string) {
    if (value) {
      this.setAttribute("gap", value);
    } else {
      this.removeAttribute("gap");
    }
  }

  #render() {
    if (!this.shadowRoot) return;
    const direction = this.direction;
    const gap = this.gap;
    const flexDir = direction === "row" ? "row" : direction === "none" ? "initial" : "column";
    this.shadowRoot.innerHTML = `
      <style>${ArsGroup.#styles()}</style>
      <div class="group" part="group" style="flex-direction: ${flexDir}; gap: ${gap || '0'};">
        <slot></slot>
      </div>
    `;
  }

  static #styles(): string {
    return `
      :host { display: block; }
      .group {
        display: flex;
        align-items: stretch;
        width: 100%;
        height: 100%;
      }
    `;
  }
}

window.customElements.define("ars-group", ArsGroup);

export { ArsGroup };
