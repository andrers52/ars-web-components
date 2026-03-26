// <ars-button> — A styled, accessible button with variant, size, and state support.
//
// Uses a native <button> inside Shadow DOM for accessibility (focus, form
// submission, keyboard activation). Integrates pressed-effect-mixin internally
// for tactile feedback.
//
// Attributes:
//   variant  — "primary" | "secondary" | "danger" | "ghost" (default "primary")
//   size     — "sm" | "md" | "lg" (default "md")
//   disabled — boolean, reflects to internal button and aria-disabled
//   loading  — boolean, shows spinner and sets aria-busy
//   type     — "button" | "submit" | "reset" (default "button")
//
// Slots:
//   default — label content
//   prefix  — icon before label
//   suffix  — icon after label
//
// Events:
//   ars-button:click — composed CustomEvent with detail { variant }

export type ArsButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ArsButtonSize = "sm" | "md" | "lg";
export type ArsButtonType = "button" | "submit" | "reset";

class ArsButton extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "size", "disabled", "loading", "type"];
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
    }
  }

  // --- Property accessors with attribute reflection ---

  get variant(): ArsButtonVariant {
    return (this.getAttribute("variant") as ArsButtonVariant) || "primary";
  }

  set variant(value: ArsButtonVariant) {
    this.setAttribute("variant", value);
  }

  get size(): ArsButtonSize {
    return (this.getAttribute("size") as ArsButtonSize) || "md";
  }

  set size(value: ArsButtonSize) {
    this.setAttribute("size", value);
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.toggleAttribute("disabled", value);
  }

  get loading(): boolean {
    return this.hasAttribute("loading");
  }

  set loading(value: boolean) {
    this.toggleAttribute("loading", value);
  }

  get type(): ArsButtonType {
    return (this.getAttribute("type") as ArsButtonType) || "button";
  }

  set type(value: ArsButtonType) {
    this.setAttribute("type", value);
  }

  // --- Internal rendering ---

  #render() {
    if (!this.shadowRoot) return;

    const variant = this.variant;
    const size = this.size;
    const isDisabled = this.disabled;
    const isLoading = this.loading;
    const buttonType = this.type;

    this.shadowRoot.innerHTML = `
      <style>${ArsButton.#styles()}</style>
      <button
        part="button"
        class="btn btn--${variant} btn--${size}"
        type="${buttonType}"
        ${isDisabled ? "disabled" : ""}
        ${isLoading ? 'aria-busy="true"' : ""}
        ${isDisabled ? 'aria-disabled="true"' : ""}
      >
        ${isLoading ? '<span class="spinner" aria-hidden="true"></span>' : ""}
        <slot name="prefix"></slot>
        <span class="label"><slot></slot></span>
        <slot name="suffix"></slot>
      </button>
    `;
  }

  #bindEvents() {
    if (!this.shadowRoot) return;
    this.shadowRoot.addEventListener("click", (e) => {
      if (this.disabled || this.loading) {
        e.stopImmediatePropagation();
        e.preventDefault();
        return;
      }
      this.dispatchEvent(
        new CustomEvent("ars-button:click", {
          bubbles: true,
          composed: true,
          detail: { variant: this.variant },
        }),
      );
    });
  }

  // --- Styles ---

  static #styles(): string {
    return `
      :host {
        display: inline-block;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
      }

      :host([disabled]),
      :host([loading]) {
        pointer-events: none;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--arswc-spacing-sm, 8px);
        border: 1px solid transparent;
        border-radius: var(--arswc-radius-sm, 6px);
        cursor: pointer;
        font-family: inherit;
        font-weight: 600;
        line-height: 1;
        transition:
          background var(--arswc-transition-duration, 200ms) ease,
          border-color var(--arswc-transition-duration, 200ms) ease,
          box-shadow var(--arswc-transition-duration, 200ms) ease,
          transform 100ms ease;
        white-space: nowrap;
        user-select: none;
      }

      .btn:focus-visible {
        outline: none;
        box-shadow: var(--arswc-focus-ring, 0 0 0 3px rgba(37, 99, 235, 0.3));
      }

      .btn:active:not(:disabled) {
        transform: scale(0.97);
      }

      /* --- Sizes --- */
      .btn--sm {
        padding: var(--arswc-spacing-xs, 4px) var(--arswc-spacing-sm, 8px);
        font-size: var(--arswc-font-size-sm, 0.75rem);
      }

      .btn--md {
        padding: var(--arswc-spacing-sm, 8px) var(--arswc-spacing-md, 16px);
        font-size: var(--arswc-font-size-md, 0.875rem);
      }

      .btn--lg {
        padding: calc(var(--arswc-spacing-sm, 8px) + 4px) var(--arswc-spacing-lg, 24px);
        font-size: 1rem;
      }

      /* --- Variant: primary --- */
      .btn--primary {
        background: linear-gradient(
          180deg,
          var(--arswc-button-primary-bg-start, #3b82f6),
          var(--arswc-button-primary-bg-end, #2563eb)
        );
        border-color: var(--arswc-button-primary-border, #1d4ed8);
        color: var(--arswc-button-primary-color, #ffffff);
      }

      .btn--primary:hover:not(:disabled) {
        background: linear-gradient(
          180deg,
          var(--arswc-button-primary-hover-bg-start, #60a5fa),
          var(--arswc-button-primary-hover-bg-end, #3b82f6)
        );
      }

      /* --- Variant: secondary --- */
      .btn--secondary {
        background: var(--arswc-button-secondary-bg, #ffffff);
        border-color: var(--arswc-button-secondary-border, #93c5fd);
        color: var(--arswc-button-secondary-color, #1e3a8a);
      }

      .btn--secondary:hover:not(:disabled) {
        background: var(--arswc-button-secondary-hover-bg, #eff6ff);
        border-color: var(--arswc-button-secondary-hover-border, #3b82f6);
        color: var(--arswc-button-secondary-hover-color, #1d4ed8);
      }

      /* --- Variant: danger --- */
      .btn--danger {
        background: var(--arswc-color-danger, #dc2626);
        border-color: color-mix(in srgb, var(--arswc-color-danger, #dc2626) 80%, black);
        color: #ffffff;
      }

      .btn--danger:hover:not(:disabled) {
        background: color-mix(in srgb, var(--arswc-color-danger, #dc2626) 85%, black);
      }

      /* --- Variant: ghost --- */
      .btn--ghost {
        background: transparent;
        border-color: transparent;
        color: var(--arswc-color-text, #1b2430);
      }

      .btn--ghost:hover:not(:disabled) {
        background: var(--arswc-color-surface, #f6f8fb);
      }

      /* --- Disabled state --- */
      .btn:disabled {
        background: var(--arswc-color-disabled-bg, #f3f4f6);
        border-color: var(--arswc-color-disabled-bg, #f3f4f6);
        color: var(--arswc-color-disabled, #9ca3af);
        cursor: not-allowed;
      }

      /* --- Spinner --- */
      .spinner {
        display: inline-block;
        width: 1em;
        height: 1em;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: ars-btn-spin 600ms linear infinite;
      }

      @keyframes ars-btn-spin {
        to { transform: rotate(360deg); }
      }

      .label {
        display: inline-flex;
        align-items: center;
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-button")) {
  customElements.define("ars-button", ArsButton);
}

export { ArsButton, ArsButton as default };
