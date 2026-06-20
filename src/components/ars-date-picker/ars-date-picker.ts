// <ars-date-picker> — Inline date selector with confirm / cancel actions.
//
// Renders a native date input inside a styled card with OK and Cancel
// buttons.  Dispatches semantic events so hosts can react without
// holding widget logic.
//
// Attributes:
//   value   — ISO date string (yyyy-mm-dd).  Defaults to today.
//   label   — Optional header text (default "Select date").
//   open    — Boolean; when present the picker is visible.
//
// Properties:
//   value   — string (read/write)
//   label   — string (read/write)
//   isOpen  — boolean (read/write)
//
// Events:
//   ars-date-picker:select — composed CustomEvent with detail { date }
//   ars-date-picker:cancel — composed CustomEvent with no detail

class ArsDatePicker extends HTMLElement {
  static get observedAttributes() {
    return ["value", "label", "open"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#bindEvents();
  }

  attributeChangedCallback(
    _name: string,
    _oldVal: string | null,
    _newVal: string | null,
  ) {
    if (this.shadowRoot) this.#render();
  }

  // --- Property accessors ---

  get value(): string {
    return this.getAttribute("value") ?? this.#today();
  }

  set value(v: string) {
    this.setAttribute("value", v);
  }

  get label(): string {
    return this.getAttribute("label") ?? "Select date";
  }

  set label(v: string) {
    this.setAttribute("label", v);
  }

  get isOpen(): boolean {
    return this.hasAttribute("open");
  }

  set isOpen(v: boolean) {
    this.toggleAttribute("open", v);
  }

  // --- Public API ---

  /** Show the picker. */
  open() {
    this.isOpen = true;
    // Focus the input for immediate keyboard interaction.
    requestAnimationFrame(() => {
      const input = this.shadowRoot?.querySelector<HTMLInputElement>("input[type=date]");
      input?.focus();
    });
  }

  /** Hide the picker without emitting an event. */
  close() {
    this.isOpen = false;
  }

  // --- Internals ---

  #today(): string {
    return new Date().toISOString().split("T")[0]!;
  }

  #render() {
    if (!this.shadowRoot) return;

    const visible = this.isOpen ? "block" : "none";

    this.shadowRoot.innerHTML = `
      <style>${ArsDatePicker.#styles}</style>
      <div class="picker" style="display:${visible}">
        <div class="header">${ArsDatePicker.#escapeHtml(this.label)}</div>
        <input
          type="date"
          class="date-input"
          value="${ArsDatePicker.#escapeAttr(this.value)}"
        />
        <div class="actions">
          <button type="button" class="btn btn--cancel">Cancel</button>
          <button type="button" class="btn btn--ok">OK</button>
        </div>
      </div>
    `;
  }

  #bindEvents() {
    if (!this.shadowRoot) return;

    this.shadowRoot.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains("btn--cancel")) {
        this.dispatchEvent(
          new CustomEvent("ars-date-picker:cancel", {
            bubbles: true,
            composed: true,
          }),
        );
        return;
      }

      if (target.classList.contains("btn--ok")) {
        const input = this.shadowRoot?.querySelector<HTMLInputElement>("input[type=date]");
        const date = input?.value ?? this.value;
        this.dispatchEvent(
          new CustomEvent("ars-date-picker:select", {
            bubbles: true,
            composed: true,
            detail: { date },
          }),
        );
        return;
      }
    });

    // Allow Enter to confirm and Escape to cancel.
    this.shadowRoot.addEventListener("keydown", (e) => {
      const key = (e as KeyboardEvent).key;
      if (key === "Enter") {
        const input = this.shadowRoot?.querySelector<HTMLInputElement>("input[type=date]");
        const date = input?.value ?? this.value;
        this.dispatchEvent(
          new CustomEvent("ars-date-picker:select", {
            bubbles: true,
            composed: true,
            detail: { date },
          }),
        );
      } else if (key === "Escape") {
        this.dispatchEvent(
          new CustomEvent("ars-date-picker:cancel", {
            bubbles: true,
            composed: true,
          }),
        );
      }
    });
  }

  static #escapeHtml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  static #escapeAttr(value: string): string {
    return value.replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }

  static #styles = `
    :host {
      display: inline-block;
      font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
    }

    .picker {
      background: var(--ars-date-picker-bg, #1e1e2e);
      border: 1px solid var(--ars-date-picker-border-color, #333);
      border-radius: var(--ars-date-picker-radius, 8px);
      padding: 16px;
      box-shadow: var(--ars-date-picker-shadow, 0 8px 24px rgba(0,0,0,0.5));
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 220px;
    }

    .header {
      color: var(--ars-date-picker-header-color, #cdd6f4);
      font-size: 0.95rem;
      font-weight: 600;
    }

    .date-input {
      padding: 8px 10px;
      border-radius: 4px;
      border: 1px solid var(--ars-date-picker-input-border, #444);
      background: var(--ars-date-picker-input-bg, #11111b);
      color: var(--ars-date-picker-input-color, #cdd6f4);
      font-size: 0.9rem;
      outline: none;
      cursor: pointer;
    }

    .date-input:focus {
      border-color: var(--ars-date-picker-input-focus-border, #43a7ff);
      box-shadow: 0 0 0 2px var(--ars-date-picker-input-focus-ring, rgba(67,167,255,0.25));
    }

    /* Webkit calendar-picker-indicator theming for dark backgrounds */
    .date-input::-webkit-calendar-picker-indicator {
      filter: invert(0.8);
      cursor: pointer;
    }

    .actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .btn {
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background 0.12s ease, transform 0.08s ease;
    }

    .btn:hover {
      transform: translateY(-1px);
    }

    .btn--cancel {
      border: 1px solid var(--ars-date-picker-cancel-border, #444);
      background: none;
      color: var(--ars-date-picker-cancel-color, #cdd6f4);
    }

    .btn--cancel:hover {
      background: var(--ars-date-picker-cancel-hover-bg, rgba(255,255,255,0.05));
    }

    .btn--ok {
      border: none;
      background: var(--ars-date-picker-ok-bg, #43a7ff);
      color: var(--ars-date-picker-ok-color, #07111d);
      font-weight: 600;
    }

    .btn--ok:hover {
      background: var(--ars-date-picker-ok-hover-bg, #66b8ff);
    }
  `;
}

export { ArsDatePicker, ArsDatePicker as default };
