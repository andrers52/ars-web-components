// <ars-avatar> — A circular or rounded image avatar with fallback initials.
//
// Attributes:
//   src    — image URL
//   alt    — accessible description
//   size   — "sm" | "md" | "lg" | "xl" (default "md")
//   shape  — "circle" | "square" | "rounded" (default "circle")
//   fallback — text to display when image fails or is absent (e.g., "JD")
//
// Slots:
//   default — overrides fallback text
//   icon    — icon or SVG to display when image is absent
//
// Events:
//   ars-avatar:error — when image fails to load

export type ArsAvatarSize = "sm" | "md" | "lg" | "xl";
export type ArsAvatarShape = "circle" | "square" | "rounded";

class ArsAvatar extends HTMLElement {
  static get observedAttributes() {
    return ["src", "alt", "size", "shape", "fallback"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#bindEvents();
  }

  attributeChangedCallback(name: string) {
    if (this.shadowRoot) {
      if (name === "src") {
        this.#render();
        this.#bindEvents();
      } else {
        this.#render();
      }
    }
  }

  // --- Property accessors ---

  get src(): string {
    return this.getAttribute("src") ?? "";
  }

  set src(value: string) {
    this.setAttribute("src", value);
  }

  get alt(): string {
    return this.getAttribute("alt") ?? "";
  }

  set alt(value: string) {
    this.setAttribute("alt", value);
  }

  get size(): ArsAvatarSize {
    return (this.getAttribute("size") as ArsAvatarSize) || "md";
  }

  set size(value: ArsAvatarSize) {
    this.setAttribute("size", value);
  }

  get shape(): ArsAvatarShape {
    return (this.getAttribute("shape") as ArsAvatarShape) || "circle";
  }

  set shape(value: ArsAvatarShape) {
    this.setAttribute("shape", value);
  }

  get fallback(): string {
    return this.getAttribute("fallback") ?? "";
  }

  set fallback(value: string) {
    this.setAttribute("fallback", value);
  }

  // --- Rendering ---

  #render() {
    if (!this.shadowRoot) return;

    const src = this.src;
    const altText = this.alt;
    const size = this.size;
    const shape = this.shape;
    const fallback = this.fallback;

    const hasSrc = src.trim().length > 0;

    this.shadowRoot.innerHTML = `
      <style>${ArsAvatar.#styles()}</style>
      <div
        part="avatar"
        class="avatar avatar--${size} avatar--${shape}"
        role="img"
        aria-label="${altText || fallback || "avatar"}"
      >
        ${hasSrc
          ? `<img class="avatar__image" src="${src}" alt="${altText}" part="image">`
          : ""
        }
        <div class="avatar__fallback" part="fallback">
          <slot name="icon"></slot>
          <slot>${fallback}</slot>
        </div>
      </div>
    `;
  }

  #bindEvents() {
    if (!this.shadowRoot) return;

    const img = this.shadowRoot.querySelector("img");
    if (!img) return;

    const onError = () => {
      img.style.display = "none";
      const fallbackEl = this.shadowRoot?.querySelector(".avatar__fallback");
      if (fallbackEl) {
        (fallbackEl as HTMLElement).style.display = "flex";
      }
      this.dispatchEvent(
        new CustomEvent("ars-avatar:error", {
          bubbles: true,
          composed: true,
          detail: { src: this.src },
        }),
      );
    };

    const onLoad = () => {
      img.style.display = "block";
      const fallbackEl = this.shadowRoot?.querySelector(".avatar__fallback");
      if (fallbackEl) {
        (fallbackEl as HTMLElement).style.display = "none";
      }
    };

    img.addEventListener("error", onError);
    img.addEventListener("load", onLoad);

    // If image is already cached/broken, trigger handlers immediately
    if (img.complete) {
      if (img.naturalWidth === 0) {
        onError();
      } else {
        onLoad();
      }
    }
  }

  static #styles(): string {
    return `
      :host {
        display: inline-flex;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
      }

      .avatar {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        background: var(--arswc-color-surface, #f6f8fb);
        border: 1px solid var(--arswc-color-border, #d5dde8);
        color: var(--arswc-color-text, #1b2430);
        font-weight: 600;
        line-height: 1;
        user-select: none;
      }

      /* --- Sizes --- */
      .avatar--sm {
        width: 24px;
        height: 24px;
        font-size: 0.625rem;
      }

      .avatar--md {
        width: 40px;
        height: 40px;
        font-size: 0.875rem;
      }

      .avatar--lg {
        width: 56px;
        height: 56px;
        font-size: 1.125rem;
      }

      .avatar--xl {
        width: 80px;
        height: 80px;
        font-size: 1.5rem;
      }

      /* --- Shapes --- */
      .avatar--circle {
        border-radius: 50%;
      }

      .avatar--square {
        border-radius: var(--arswc-radius-sm, 6px);
      }

      .avatar--rounded {
        border-radius: var(--arswc-radius-md, 10px);
      }

      /* --- Image --- */
      .avatar__image {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: none;
      }

      /* --- Fallback --- */
      .avatar__fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-avatar")) {
  customElements.define("ars-avatar", ArsAvatar);
}

export { ArsAvatar, ArsAvatar as default };
