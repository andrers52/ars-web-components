// <ars-badge> — A compact status indicator for labels, counts, and states.
//
// Attributes:
//   variant — "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "neutral"
//             (default "neutral")
//   size    — "sm" | "md" | "lg" (default "md")
//   pill    — boolean, renders with full border-radius
//   dot     — boolean, renders as a small status dot without text
//
// Slots:
//   default — badge text content
//
// Events:
//   none

export type ArsBadgeVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export type ArsBadgeSize = "sm" | "md" | "lg";

class ArsBadge extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "size", "pill", "dot"];
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

  // --- Property accessors ---

  get variant(): ArsBadgeVariant {
    return (this.getAttribute("variant") as ArsBadgeVariant) || "neutral";
  }

  set variant(value: ArsBadgeVariant) {
    this.setAttribute("variant", value);
  }

  get size(): ArsBadgeSize {
    return (this.getAttribute("size") as ArsBadgeSize) || "md";
  }

  set size(value: ArsBadgeSize) {
    this.setAttribute("size", value);
  }

  get pill(): boolean {
    return this.hasAttribute("pill");
  }

  set pill(value: boolean) {
    this.toggleAttribute("pill", value);
  }

  get dot(): boolean {
    return this.hasAttribute("dot");
  }

  set dot(value: boolean) {
    this.toggleAttribute("dot", value);
  }

  // --- Rendering ---

  #render() {
    if (!this.shadowRoot) return;

    const variant = this.variant;
    const size = this.size;
    const isPill = this.pill;
    const isDot = this.dot;

    this.shadowRoot.innerHTML = `
      <style>${ArsBadge.#styles()}</style>
      <span
        part="badge"
        class="badge badge--${variant} badge--${size}${isPill ? " badge--pill" : ""}${isDot ? " badge--dot" : ""}"
        aria-hidden="${String(isDot)}"
      >
        ${isDot ? "" : "<slot></slot>"}
      </span>
    `;
  }

  static #styles(): string {
    return `
      :host {
        display: inline-flex;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
        vertical-align: middle;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        line-height: 1;
        white-space: nowrap;
        user-select: none;
        border: 1px solid transparent;
      }

      /* --- Sizes --- */
      .badge--sm {
        padding: 2px 6px;
        font-size: 0.65rem;
        min-height: 16px;
      }

      .badge--md {
        padding: 3px 8px;
        font-size: 0.75rem;
        min-height: 20px;
      }

      .badge--lg {
        padding: 4px 10px;
        font-size: 0.875rem;
        min-height: 24px;
      }

      /* --- Pill --- */
      .badge--pill {
        border-radius: 9999px;
      }

      .badge:not(.badge--pill) {
        border-radius: var(--arswc-radius-sm, 6px);
      }

      /* --- Dot --- */
      .badge--dot {
        width: 8px;
        height: 8px;
        padding: 0;
        border-radius: 50%;
        min-height: auto;
      }

      .badge--dot.badge--sm { width: 6px; height: 6px; }
      .badge--dot.badge--lg { width: 10px; height: 10px; }

      /* --- Variants --- */
      .badge--primary {
        background: var(--arswc-color-accent, #2563eb);
        color: var(--arswc-accent-contrast, #ffffff);
      }

      .badge--secondary {
        background: var(--arswc-color-surface, #f6f8fb);
        border-color: var(--arswc-color-border, #d5dde8);
        color: var(--arswc-color-text, #1b2430);
      }

      .badge--success {
        background: #dcfce7;
        border-color: #86efac;
        color: #166534;
      }

      .badge--warning {
        background: #fef3c7;
        border-color: #fcd34d;
        color: #92400e;
      }

      .badge--danger {
        background: #fee2e2;
        border-color: #fca5a5;
        color: #991b1b;
      }

      .badge--info {
        background: #dbeafe;
        border-color: #93c5fd;
        color: #1e3a8a;
      }

      .badge--neutral {
        background: #f3f4f6;
        border-color: #e5e7eb;
        color: #374151;
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-badge")) {
  customElements.define("ars-badge", ArsBadge);
}

export { ArsBadge, ArsBadge as default };
