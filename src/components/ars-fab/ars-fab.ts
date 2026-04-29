// <ars-fab> — Floating Action Button for primary actions.
//
// Attributes:
//   variant  — "primary" | "secondary" | "danger" (default "primary")
//   size     — "sm" | "md" | "lg" (default "md")
//   disabled — boolean
//   extended — boolean, renders with label text next to icon
//   position — "fixed" | "inline" (default "inline")
//
// Slots:
//   default — icon content
//   label   — text label (shown when extended)
//
// Events:
//   ars-fab:click — composed CustomEvent with detail { variant }

export type ArsFabVariant = "primary" | "secondary" | "danger";
export type ArsFabSize = "sm" | "md" | "lg";
export type ArsFabPosition = "fixed" | "inline";

class ArsFab extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "size", "disabled", "extended", "position"];
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

  // --- Property accessors ---

  get variant(): ArsFabVariant {
    return (this.getAttribute("variant") as ArsFabVariant) || "primary";
  }

  set variant(value: ArsFabVariant) {
    this.setAttribute("variant", value);
  }

  get size(): ArsFabSize {
    return (this.getAttribute("size") as ArsFabSize) || "md";
  }

  set size(value: ArsFabSize) {
    this.setAttribute("size", value);
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.toggleAttribute("disabled", value);
  }

  get extended(): boolean {
    return this.hasAttribute("extended");
  }

  set extended(value: boolean) {
    this.toggleAttribute("extended", value);
  }

  get position(): ArsFabPosition {
    return (this.getAttribute("position") as ArsFabPosition) || "inline";
  }

  set position(value: ArsFabPosition) {
    this.setAttribute("position", value);
  }

  // --- Rendering ---

  #render() {
    if (!this.shadowRoot) return;

    const variant = this.variant;
    const size = this.size;
    const isDisabled = this.disabled;
    const isExtended = this.extended;
    const position = this.position;

    this.shadowRoot.innerHTML = `
      <style>${ArsFab.#styles()}</style>
      <button
        part="fab"
        class="fab fab--${variant} fab--${size}${isExtended ? " fab--extended" : ""} fab--${position}"
        type="button"
        ${isDisabled ? "disabled" : ""}
        ${isDisabled ? 'aria-disabled="true"' : ""}
      >
        <span class="icon"><slot></slot></span>
        ${isExtended ? '<span class="label"><slot name="label"></slot></span>' : ""}
      </button>
    `;
  }

  #bindEvents() {
    if (!this.shadowRoot) return;

    const btn = this.shadowRoot.querySelector("button");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      if (this.disabled) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return;
      }
      this.dispatchEvent(
        new CustomEvent("ars-fab:click", {
          bubbles: true,
          composed: true,
          detail: { variant: this.variant },
        }),
      );
    });
  }

  static #styles(): string {
    return `
      :host {
        display: inline-flex;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
      }

      :host([disabled]) {
        pointer-events: none;
      }

      .fab {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--arswc-spacing-sm, 8px);
        border: none;
        cursor: pointer;
        font-family: inherit;
        font-weight: 600;
        line-height: 1;
        transition:
          background var(--arswc-transition-duration, 200ms) ease,
          box-shadow var(--arswc-transition-duration, 200ms) ease,
          transform 100ms ease;
        white-space: nowrap;
        user-select: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .fab:focus-visible {
        outline: none;
        box-shadow: var(--arswc-focus-ring, 0 0 0 3px rgba(37, 99, 235, 0.3)), 0 4px 12px rgba(0,0,0,0.15);
      }

      .fab:active:not(:disabled) {
        transform: scale(0.95);
      }

      /* --- Sizes --- */
      .fab--sm {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        font-size: 1rem;
      }

      .fab--sm.fab--extended {
        width: auto;
        padding: 0 14px;
        border-radius: 20px;
      }

      .fab--md {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        font-size: 1.25rem;
      }

      .fab--md.fab--extended {
        width: auto;
        padding: 0 20px;
        border-radius: 28px;
      }

      .fab--lg {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        font-size: 1.5rem;
      }

      .fab--lg.fab--extended {
        width: auto;
        padding: 0 28px;
        border-radius: 36px;
      }

      /* --- Variants --- */
      .fab--primary {
        background: linear-gradient(180deg, #3b82f6, #2563eb);
        color: #ffffff;
      }

      .fab--primary:hover:not(:disabled) {
        background: linear-gradient(180deg, #60a5fa, #3b82f6);
      }

      .fab--secondary {
        background: #ffffff;
        color: var(--arswc-color-text, #1b2430);
        border: 1px solid var(--arswc-color-border, #d5dde8);
      }

      .fab--secondary:hover:not(:disabled) {
        background: var(--arswc-color-surface, #f6f8fb);
      }

      .fab--danger {
        background: var(--arswc-color-danger, #dc2626);
        color: #ffffff;
      }

      .fab--danger:hover:not(:disabled) {
        background: color-mix(in srgb, var(--arswc-color-danger, #dc2626) 85%, black);
      }

      /* --- Disabled --- */
      .fab:disabled {
        background: var(--arswc-color-disabled-bg, #f3f4f6);
        color: var(--arswc-color-disabled, #9ca3af);
        cursor: not-allowed;
        box-shadow: none;
      }

      /* --- Fixed position --- */
      .fab--fixed {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 100;
      }

      /* --- Icon / Label --- */
      .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .label {
        font-size: var(--arswc-font-size-md, 0.875rem);
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-fab")) {
  customElements.define("ars-fab", ArsFab);
}

export { ArsFab, ArsFab as default };
