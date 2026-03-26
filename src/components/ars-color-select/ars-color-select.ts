// <ars-color-select> — Carousel-based color picker.
//
// Renders a horizontal carousel strip of circular color swatches. The user
// clicks/taps to select, uses arrow keys to navigate, and the selected swatch
// is visually emphasized.
//
// Attributes:
//   color         — current selected color (read/write, backwards compatible)
//   palette       — JSON array of color strings (overrides default)
//   swatch-size   — "sm" | "md" | "lg" (default "md")
//   disabled      — boolean
//   visible-count — number of swatches visible at once (default 7)
//
// Properties:
//   color         — string (read/write)
//   palette       — string[] (read/write)
//   selectedIndex — number (read-only)
//
// Events:
//   ars-color-select:change — composed CustomEvent with detail
//     { id, color, previousColor }

export type ArsColorSelectSwatchSize = "sm" | "md" | "lg";

// Curated default palette ordered by hue (spectrum order)
const DEFAULT_PALETTE: string[] = [
  // Reds
  "#DC2626", "#EF4444", "#F87171",
  // Oranges
  "#EA580C", "#F97316", "#FB923C",
  // Yellows
  "#CA8A04", "#EAB308", "#FACC15",
  // Greens
  "#16A34A", "#22C55E", "#4ADE80",
  // Teals
  "#0D9488", "#14B8A6", "#2DD4BF",
  // Cyans
  "#0891B2", "#06B6D4", "#22D3EE",
  // Blues
  "#2563EB", "#3B82F6", "#60A5FA",
  // Indigos
  "#4F46E5", "#6366F1", "#818CF8",
  // Purples
  "#7C3AED", "#8B5CF6", "#A78BFA",
  // Pinks
  "#DB2777", "#EC4899", "#F472B6",
  // Neutrals
  "#1F2937", "#6B7280", "#D1D5DB", "#F9FAFB",
];

class ArsColorSelect extends HTMLElement {
  private _palette: string[] = [...DEFAULT_PALETTE];
  private _scrollOffset = 0;
  private _selectedIdx = 0;
  private _eventsBound = false;

  static get observedAttributes() {
    return ["color", "palette", "swatch-size", "disabled", "visible-count"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    // Initialize selection from color attribute if present
    const initialColor = this.getAttribute("color");
    if (initialColor) {
      const idx = this._palette.findIndex(
        (c) => c.toLowerCase() === initialColor.toLowerCase(),
      );
      if (idx >= 0) this._selectedIdx = idx;
    }
    this.#render();
    this.#bindEvents();
    // Make focusable for keyboard navigation
    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "0");
    }
  }

  attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null) {
    if (name === "palette" && newVal) {
      try {
        this._palette = JSON.parse(newVal);
        this._selectedIdx = 0;
        this._scrollOffset = 0;
      } catch { /* keep existing palette */ }
    }
    if (name === "color" && newVal && oldVal !== newVal) {
      const previousColor = oldVal ?? "";
      const idx = this._palette.findIndex(
        (c) => c.toLowerCase() === newVal.toLowerCase(),
      );
      if (idx >= 0) {
        this._selectedIdx = idx;
        this.#scrollToSelected();
      }
      this.dispatchEvent(
        new CustomEvent("ars-color-select:change", {
          bubbles: true,
          composed: true,
          detail: { id: this.id, color: newVal, previousColor },
        }),
      );
    }
    if (this.shadowRoot) this.#render();
  }

  // --- Property accessors ---

  get color(): string {
    return this.getAttribute("color") ?? this._palette[this._selectedIdx] ?? "";
  }

  set color(value: string) {
    this.setAttribute("color", value);
  }

  get palette(): string[] {
    return [...this._palette];
  }

  set palette(value: string[]) {
    this._palette = [...value];
    this._selectedIdx = 0;
    this._scrollOffset = 0;
    this.setAttribute("palette", JSON.stringify(value));
  }

  get selectedIndex(): number {
    return this._selectedIdx;
  }

  get swatchSize(): ArsColorSelectSwatchSize {
    return (this.getAttribute("swatch-size") as ArsColorSelectSwatchSize) || "md";
  }

  set swatchSize(value: ArsColorSelectSwatchSize) {
    this.setAttribute("swatch-size", value);
  }

  get visibleCount(): number {
    return parseInt(this.getAttribute("visible-count") ?? "7", 10);
  }

  set visibleCount(value: number) {
    this.setAttribute("visible-count", String(value));
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.toggleAttribute("disabled", value);
  }

  // --- Deprecated API (backwards compatibility) ---

  /** @deprecated Use the `color` property setter instead. */
  setBackgroundColor(color: string) {
    this.color = color;
  }

  /** @deprecated No longer applicable (overlay removed). Use the component directly. */
  toggleColorSelection() {
    // No-op: the overlay model was removed in the carousel redesign.
  }

  // --- Selection ---

  #selectIndex(idx: number) {
    if (this.disabled || idx < 0 || idx >= this._palette.length) return;
    const previousColor = this.color;
    this._selectedIdx = idx;
    this.setAttribute("color", this._palette[idx]);
    // Note: the attributeChangedCallback fires the event
    // If color didn't change (same value), manually re-render
    if (this._palette[idx].toLowerCase() === previousColor.toLowerCase()) {
      this.#render();
    }
  }

  #scrollToSelected() {
    const visCount = this.visibleCount;
    // Ensure selected is visible
    if (this._selectedIdx < this._scrollOffset) {
      this._scrollOffset = this._selectedIdx;
    } else if (this._selectedIdx >= this._scrollOffset + visCount) {
      this._scrollOffset = this._selectedIdx - visCount + 1;
    }
  }

  // Updates only scroll-related styles on existing DOM so the CSS
  // transition on .strip animates the movement instead of snapping.
  #updateScroll() {
    if (!this.shadowRoot) return;
    const swatchPx = this.#getSwatchPx();
    const gap = 8;
    const visCount = this.visibleCount;
    const translateX = -(this._scrollOffset * (swatchPx + gap));
    const trackProgress = this._palette.length > visCount
      ? this._scrollOffset / (this._palette.length - visCount)
      : 0;

    const strip = this.shadowRoot.querySelector(".strip") as HTMLElement | null;
    if (strip) strip.style.transform = `translateX(${translateX}px)`;

    const marker = this.shadowRoot.querySelector(".track-marker") as HTMLElement | null;
    if (marker) marker.style.left = `${trackProgress * 100}%`;

    const prevBtn = this.shadowRoot.querySelector(".nav-btn--prev") as HTMLButtonElement | null;
    const nextBtn = this.shadowRoot.querySelector(".nav-btn--next") as HTMLButtonElement | null;
    if (prevBtn) prevBtn.disabled = this._scrollOffset <= 0;
    if (nextBtn) nextBtn.disabled = this._scrollOffset >= this._palette.length - visCount;
  }

  // --- Rendering ---

  #getSwatchPx(): number {
    const size = this.swatchSize;
    if (size === "sm") return 28;
    if (size === "lg") return 48;
    return 36; // md
  }

  #render() {
    if (!this.shadowRoot) return;

    const swatchPx = this.#getSwatchPx();
    const gap = 8;
    const visCount = this.visibleCount;
    const totalWidth = visCount * (swatchPx + gap) - gap;
    // Horizontal padding for scale overflow, capped so next off-screen swatch stays hidden
    const hPad = Math.min(Math.ceil(swatchPx * 0.15 + 1), gap - 1);
    const trackProgress = this._palette.length > visCount
      ? this._scrollOffset / (this._palette.length - visCount)
      : 0;

    const swatchesHtml = this._palette
      .map((c, i) => {
        const isSelected = i === this._selectedIdx;
        return `<div
          class="swatch ${isSelected ? "swatch--selected" : ""}"
          role="option"
          aria-selected="${String(isSelected)}"
          aria-label="${ArsColorSelect.#escapeAttr(c)}"
          data-index="${i}"
          style="background-color: ${c};"
          ${isSelected ? 'tabindex="0"' : 'tabindex="-1"'}
        ></div>`;
      })
      .join("");

    const translateX = -(this._scrollOffset * (swatchPx + gap));

    this.shadowRoot.innerHTML = `
      <style>${ArsColorSelect.#styles(swatchPx, gap, totalWidth, hPad)}</style>
      <div class="carousel" role="listbox" aria-orientation="horizontal" aria-label="Color palette">
        <button class="nav-btn nav-btn--prev" aria-label="Previous colors"
                ${this._scrollOffset <= 0 ? "disabled" : ""}>&lsaquo;</button>
        <div class="viewport">
          <div class="strip" style="transform: translateX(${translateX}px);">
            ${swatchesHtml}
          </div>
        </div>
        <button class="nav-btn nav-btn--next" aria-label="Next colors"
                ${this._scrollOffset >= this._palette.length - visCount ? "disabled" : ""}>&rsaquo;</button>
      </div>
      <div class="track">
        <div class="track-marker" style="left: ${trackProgress * 100}%;"></div>
      </div>
    `;
  }

  #bindEvents() {
    if (!this.shadowRoot || this._eventsBound) return;
    this._eventsBound = true;

    // Swatch click/tap
    this.shadowRoot.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("swatch")) {
        const idx = parseInt(target.dataset.index ?? "0", 10);
        this.#selectIndex(idx);
      }
      if (target.classList.contains("nav-btn--prev")) {
        this._scrollOffset = Math.max(0, this._scrollOffset - this.visibleCount);
        this.#updateScroll();
      }
      if (target.classList.contains("nav-btn--next")) {
        this._scrollOffset = Math.min(
          this._palette.length - this.visibleCount,
          this._scrollOffset + this.visibleCount,
        );
        this.#updateScroll();
      }
    });

    // Keyboard navigation
    this.addEventListener("keydown", (evt) => {
      if (this.disabled) return;
      const e = evt as KeyboardEvent;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          this.#selectIndex(Math.min(this._selectedIdx + 1, this._palette.length - 1));
          this.#scrollToSelected();
          this.#updateScroll();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          this.#selectIndex(Math.max(this._selectedIdx - 1, 0));
          this.#scrollToSelected();
          this.#updateScroll();
          break;
        case "Home":
          e.preventDefault();
          this.#selectIndex(0);
          this._scrollOffset = 0;
          this.#updateScroll();
          break;
        case "End":
          e.preventDefault();
          this.#selectIndex(this._palette.length - 1);
          this.#scrollToSelected();
          this.#updateScroll();
          break;
      }
    });
  }

  static #escapeAttr(value: string): string {
    return value.replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }

  static #styles(swatchPx: number, gap: number, totalWidth: number, hPad: number): string {
    return `
      :host {
        display: inline-block;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
      }

      :host([disabled]) {
        pointer-events: none;
        opacity: 0.5;
      }

      .carousel {
        display: flex;
        align-items: center;
        gap: var(--arswc-spacing-xs, 4px);
      }

      .viewport {
        width: ${totalWidth}px;
        overflow: hidden;
        flex-shrink: 0;
        /* Padding prevents clipping of the scaled/lifted selected swatch.
           Horizontal pad is capped to gap-1 so the next off-screen swatch stays hidden. */
        padding: ${Math.ceil(swatchPx * 0.2 + 4)}px ${hPad}px ${Math.ceil(swatchPx * 0.1)}px ${hPad}px;
      }

      .strip {
        display: flex;
        gap: ${gap}px;
        transition: transform var(--ars-color-select-transition-duration, var(--arswc-transition-duration, 200ms)) ease-in-out;
      }

      @media (prefers-reduced-motion: reduce) {
        .strip { transition: none; }
      }

      .swatch {
        box-sizing: border-box;
        width: ${swatchPx}px;
        height: ${swatchPx}px;
        border-radius: var(--ars-color-select-swatch-radius, 50%);
        border: 2px solid transparent;
        cursor: pointer;
        flex-shrink: 0;
        transition:
          transform var(--arswc-transition-duration, 200ms) ease,
          box-shadow var(--arswc-transition-duration, 200ms) ease,
          border-color var(--arswc-transition-duration, 200ms) ease;
      }

      .swatch:hover {
        transform: scale(1.1) translateY(-2px);
      }

      .swatch--selected {
        transform: scale(var(--ars-color-select-selected-scale, 1.3)) translateY(-3px);
        border-color: #fff;
        box-shadow: var(--ars-color-select-selected-shadow, 0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.06));
      }

      .swatch--selected:hover {
        transform: scale(var(--ars-color-select-selected-scale, 1.3)) translateY(-3px);
      }

      .swatch:focus-visible {
        outline: none;
        box-shadow: var(--arswc-focus-ring, 0 0 0 3px rgba(37, 99, 235, 0.3));
      }

      .nav-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: 1px solid var(--arswc-color-border, #d5dde8);
        border-radius: 50%;
        background: var(--arswc-color-surface, #f6f8fb);
        color: var(--arswc-color-text, #1b2430);
        font-size: 1.2rem;
        cursor: pointer;
        flex-shrink: 0;
        transition: background var(--arswc-transition-duration, 200ms) ease;
        line-height: 1;
      }

      .nav-btn:hover:not(:disabled) {
        background: var(--arswc-color-border, #d5dde8);
      }

      .nav-btn:disabled {
        opacity: 0.3;
        cursor: default;
      }

      .track {
        position: relative;
        height: var(--ars-color-select-track-height, 3px);
        background: var(--ars-color-select-track-color, var(--arswc-color-border, #d5dde8));
        border-radius: 2px;
        margin-top: var(--arswc-spacing-sm, 8px);
      }

      .track-marker {
        position: absolute;
        top: -2px;
        width: 12px;
        height: 7px;
        border-radius: 4px;
        background: var(--ars-color-select-track-active-color, var(--arswc-color-accent, #2563eb));
        transform: translateX(-50%);
        transition: left var(--arswc-transition-duration, 200ms) ease;
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-color-select")) {
  customElements.define("ars-color-select", ArsColorSelect);
}

export { ArsColorSelect, ArsColorSelect as default };
