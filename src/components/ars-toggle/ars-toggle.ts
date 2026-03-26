// <ars-toggle> — A switch/toggle control for boolean state.
//
// Uses a hidden checkbox internally for form participation and accessibility.
// Renders a styled track and thumb with smooth CSS transition.
//
// Attributes:
//   checked        — boolean, the toggle state
//   disabled       — boolean
//   label          — string, visible label text
//   label-position — "start" | "end" (default "end")
//
// Slots:
//   default — custom label content (overrides label attribute)
//
// Events:
//   ars-toggle:change — composed CustomEvent with detail { checked: boolean }

export type ArsToggleLabelPosition = "start" | "end";

class ArsToggle extends HTMLElement {
  static get observedAttributes() {
    return ["checked", "disabled", "label", "label-position"];
  }

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

  // --- Property accessors ---

  get checked(): boolean {
    return this.hasAttribute("checked");
  }

  set checked(value: boolean) {
    this.toggleAttribute("checked", value);
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.toggleAttribute("disabled", value);
  }

  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get labelPosition(): ArsToggleLabelPosition {
    return (this.getAttribute("label-position") as ArsToggleLabelPosition) || "end";
  }

  set labelPosition(value: ArsToggleLabelPosition) {
    this.setAttribute("label-position", value);
  }

  // --- Toggling ---

  /** Toggles the checked state and dispatches a change event. */
  toggle() {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.dispatchEvent(
      new CustomEvent("ars-toggle:change", {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked },
      }),
    );
  }

  // --- Rendering ---

  #render() {
    if (!this.shadowRoot) return;

    const isChecked = this.checked;
    const isDisabled = this.disabled;
    const labelText = this.label;
    const labelPos = this.labelPosition;

    this.shadowRoot.innerHTML = `
      <style>${ArsToggle.#styles()}</style>
      <label class="toggle ${isDisabled ? "toggle--disabled" : ""} toggle--label-${labelPos}"
             role="switch"
             aria-checked="${String(isChecked)}"
             ${isDisabled ? 'aria-disabled="true"' : ""}>
        <span class="label-text"><slot>${labelText}</slot></span>
        <span class="track ${isChecked ? "track--on" : ""}">
          <span class="thumb"></span>
        </span>
        <input type="checkbox" class="sr-only"
               ${isChecked ? "checked" : ""}
               ${isDisabled ? "disabled" : ""}
               tabindex="-1"
               aria-hidden="true">
      </label>
    `;
  }

  #bindEvents() {
    if (!this.shadowRoot) return;

    // Click on the whole label/track area toggles state
    this.shadowRoot.addEventListener("click", (e) => {
      e.preventDefault();
      this.toggle();
    });

    // Keyboard: Space and Enter toggle state
    this.shadowRoot.addEventListener("keydown", (evt) => {
      const e = evt as KeyboardEvent;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        this.toggle();
      }
    });

    // Make the component focusable
    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "0");
    }
  }

  static #styles(): string {
    return `
      :host {
        display: inline-block;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
      }

      :host([disabled]) {
        pointer-events: none;
        opacity: 0.6;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0,0,0,0);
        white-space: nowrap;
        border: 0;
      }

      .toggle {
        display: inline-flex;
        align-items: center;
        gap: var(--arswc-spacing-sm, 8px);
        cursor: pointer;
        user-select: none;
      }

      .toggle--disabled {
        cursor: not-allowed;
      }

      .toggle--label-start {
        flex-direction: row;
      }

      .toggle--label-end {
        flex-direction: row-reverse;
      }

      .label-text {
        color: var(--arswc-color-text, #1b2430);
        font-size: var(--arswc-font-size-md, 0.875rem);
      }

      .track {
        position: relative;
        display: inline-flex;
        align-items: center;
        width: 40px;
        height: 22px;
        border-radius: 11px;
        background: var(--arswc-color-border, #d5dde8);
        transition: background var(--arswc-transition-duration, 200ms) ease;
        flex-shrink: 0;
      }

      .track--on {
        background: var(--arswc-color-accent, #2563eb);
      }

      .thumb {
        position: absolute;
        left: 2px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #ffffff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        transition: transform var(--arswc-transition-duration, 200ms) ease;
      }

      .track--on .thumb {
        transform: translateX(18px);
      }

      :host(:focus-visible) .track {
        box-shadow: var(--arswc-focus-ring, 0 0 0 3px rgba(37, 99, 235, 0.3));
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-toggle")) {
  customElements.define("ars-toggle", ArsToggle);
}

export { ArsToggle, ArsToggle as default };
