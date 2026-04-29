// <ars-card> — A versatile content container with header, media, content, footer, and actions areas.
//
// Attributes:
//   variant    — "default" | "outlined" | "elevated" (default "default")
//   padding    — "none" | "sm" | "md" | "lg" (default "md")
//   interactive — boolean, adds hover effect and cursor pointer
//   href       — if set, renders the card as an anchor element
//
// Slots:
//   header   — card title / top area
//   media    — image or media content
//   default  — main content
//   actions  — bottom action buttons
//   footer   — footer text (e.g. metadata, timestamp)
//
// Events:
//   ars-card:click — composed CustomEvent when clicked (if interactive or href)

export type ArsCardVariant = "default" | "outlined" | "elevated";
export type ArsCardPadding = "none" | "sm" | "md" | "lg";

class ArsCard extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "padding", "interactive", "href"];
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

  get variant(): ArsCardVariant {
    return (this.getAttribute("variant") as ArsCardVariant) || "default";
  }

  set variant(value: ArsCardVariant) {
    this.setAttribute("variant", value);
  }

  get padding(): ArsCardPadding {
    return (this.getAttribute("padding") as ArsCardPadding) || "md";
  }

  set padding(value: ArsCardPadding) {
    this.setAttribute("padding", value);
  }

  get interactive(): boolean {
    return this.hasAttribute("interactive");
  }

  set interactive(value: boolean) {
    this.toggleAttribute("interactive", value);
  }

  get href(): string {
    return this.getAttribute("href") ?? "";
  }

  set href(value: string) {
    this.setAttribute("href", value);
  }

  // --- Rendering ---

  #render() {
    if (!this.shadowRoot) return;

    const variant = this.variant;
    const padding = this.padding;
    const isInteractive = this.interactive || this.href.length > 0;
    const href = this.href;

    const tag = href ? "a" : "div";
    const hrefAttr = href ? `href="${href}"` : "";

    this.shadowRoot.innerHTML = `
      <style>${ArsCard.#styles()}</style>
      <${tag}
        part="card"
        class="card card--${variant} card--padding-${padding}${isInteractive ? " card--interactive" : ""}"
        ${hrefAttr}
      >
        <div class="card__header" part="header">
          <slot name="header"></slot>
        </div>
        <div class="card__media" part="media">
          <slot name="media"></slot>
        </div>
        <div class="card__body" part="body">
          <slot></slot>
        </div>
        <div class="card__actions" part="actions">
          <slot name="actions"></slot>
        </div>
        <div class="card__footer" part="footer">
          <slot name="footer"></slot>
        </div>
      </${tag}>
    `;
  }

  #bindEvents() {
    if (!this.shadowRoot) return;

    const card = this.shadowRoot.querySelector(".card") as HTMLElement;
    if (!card) return;

    // Remove old listener if any (innerHTML rebuilds the DOM each re-render)
    // Since we rebuild, listeners are gone. Just attach:
    card.addEventListener("click", (e) => {
      if (this.interactive || this.href) {
        this.dispatchEvent(
          new CustomEvent("ars-card:click", {
            bubbles: true,
            composed: true,
            detail: { variant: this.variant, href: this.href },
          }),
        );
      }
    });
  }

  static #styles(): string {
    return `
      :host {
        display: block;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
      }

      .card {
        display: flex;
        flex-direction: column;
        width: 100%;
        overflow: hidden;
        transition: box-shadow var(--arswc-transition-duration, 200ms) ease,
                    transform var(--arswc-transition-duration, 200ms) ease;
        text-decoration: none;
        color: inherit;
        background: var(--arswc-color-surface, #ffffff);
      }

      /* --- Variants --- */
      .card--default {
        border: none;
        border-radius: var(--arswc-radius-md, 10px);
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }

      .card--outlined {
        border: 1px solid var(--arswc-color-border, #d5dde8);
        border-radius: var(--arswc-radius-md, 10px);
        box-shadow: none;
      }

      .card--elevated {
        border: none;
        border-radius: var(--arswc-radius-lg, 14px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06);
      }

      /* --- Interactive --- */
      .card--interactive {
        cursor: pointer;
      }

      .card--interactive:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.06);
      }

      .card--interactive:focus-visible {
        outline: none;
        box-shadow: var(--arswc-focus-ring, 0 0 0 3px rgba(37, 99, 235, 0.3)),
                    0 8px 24px rgba(0,0,0,0.12);
      }

      .card--interactive:active {
        transform: translateY(0);
      }

      /* --- Padding --- */
      .card--padding-sm .card__header,
      .card--padding-sm .card__body,
      .card--padding-sm .card__actions,
      .card--padding-sm .card__footer {
        padding: 12px;
      }

      .card--padding-md .card__header,
      .card--padding-md .card__body,
      .card--padding-md .card__actions,
      .card--padding-md .card__footer {
        padding: 16px;
      }

      .card--padding-lg .card__header,
      .card--padding-lg .card__body,
      .card--padding-lg .card__actions,
      .card--padding-lg .card__footer {
        padding: 24px;
      }

      .card--padding-none .card__header,
      .card--padding-none .card__body,
      .card--padding-none .card__actions,
      .card--padding-none .card__footer {
        padding: 0;
      }

      /* --- Sections --- */
      .card__header {
        font-weight: 700;
        font-size: 1.125rem;
        color: var(--arswc-color-text, #1b2430);
      }

      .card__header:empty,
      .card__media:empty,
      .card__actions:empty,
      .card__footer:empty {
        display: none;
      }

      .card__media {
        width: 100%;
        overflow: hidden;
        aspect-ratio: 16 / 9;
        background: var(--arswc-color-surface, #f6f8fb);
      }

      .card__media ::slotted(img) {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .card__body {
        flex: 1;
        color: var(--arswc-color-text-muted, #4d5563);
        font-size: var(--arswc-font-size-md, 0.875rem);
        line-height: 1.5;
      }

      .card__actions {
        display: flex;
        align-items: center;
        gap: var(--arswc-spacing-sm, 8px);
        border-top: 1px solid transparent;
      }

      .card__actions:not(:empty) {
        border-top-color: var(--arswc-color-border, #d5dde8);
      }

      .card__footer {
        font-size: var(--arswc-font-size-sm, 0.75rem);
        color: var(--arswc-color-text-muted, #4d5563);
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-card")) {
  customElements.define("ars-card", ArsCard);
}

export { ArsCard, ArsCard as default };
