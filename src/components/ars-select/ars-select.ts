// <ars-select> — Dropdown select with option groups, search filtering, and custom rendering.
//
// Attributes:
//   value       — current selected value (string, or JSON array when multiple)
//   placeholder — display text when nothing is selected
//   label       — visible label
//   disabled    — boolean
//   searchable  — boolean, shows filter input inside dropdown
//   multiple    — boolean, allows multi-select
//   error       — validation error message
//
// Properties:
//   options        — { value, label, group?, disabled? }[]
//   value          — string | string[] (when multiple)
//   selectedOption — read-only, the selected option object(s)
//
// Events:
//   ars-select:change — detail { value, previousValue }
//   ars-select:open   — dropdown opened
//   ars-select:close  — dropdown closed

export interface ArsSelectOption {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
}

class ArsSelect extends HTMLElement {
  private _options: ArsSelectOption[] = [];
  private _isOpen = false;
  private _searchTerm = "";
  private _highlightedIdx = -1;
  private _eventsBound = false;

  static get observedAttributes() {
    return ["value", "placeholder", "label", "disabled", "searchable", "multiple", "error"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#bindEvents();
    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "0");
    }
  }

  attributeChangedCallback() {
    if (this.shadowRoot) this.#render();
  }

  // --- Property accessors ---

  get options(): ArsSelectOption[] {
    return [...this._options];
  }

  set options(val: ArsSelectOption[]) {
    this._options = [...val];
    this.#render();
  }

  get value(): string | string[] {
    if (this.multiple) {
      try {
        return JSON.parse(this.getAttribute("value") ?? "[]");
      } catch {
        return [];
      }
    }
    return this.getAttribute("value") ?? "";
  }

  set value(val: string | string[]) {
    const previous = this.value;
    if (Array.isArray(val)) {
      this.setAttribute("value", JSON.stringify(val));
    } else {
      this.setAttribute("value", val);
    }
    this.dispatchEvent(
      new CustomEvent("ars-select:change", {
        bubbles: true,
        composed: true,
        detail: { value: val, previousValue: previous },
      }),
    );
  }

  get selectedOption(): ArsSelectOption | ArsSelectOption[] | undefined {
    if (this.multiple) {
      const vals = this.value as string[];
      return this._options.filter((o) => vals.includes(o.value));
    }
    return this._options.find((o) => o.value === this.value);
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "Select...";
  }

  set placeholder(val: string) {
    this.setAttribute("placeholder", val);
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(val: boolean) {
    this.toggleAttribute("disabled", val);
  }

  get searchable(): boolean {
    return this.hasAttribute("searchable");
  }

  get multiple(): boolean {
    return this.hasAttribute("multiple");
  }

  get error(): string {
    return this.getAttribute("error") ?? "";
  }

  set error(val: string) {
    if (val) this.setAttribute("error", val);
    else this.removeAttribute("error");
  }

  // --- Open/close ---

  /** Opens the dropdown panel. */
  open() {
    if (this.disabled || this._isOpen) return;
    this._isOpen = true;
    this._searchTerm = "";
    this._highlightedIdx = -1;
    this.#render();
    this.dispatchEvent(new CustomEvent("ars-select:open", { bubbles: true, composed: true }));
    // Focus search if searchable
    setTimeout(() => {
      this.shadowRoot?.querySelector<HTMLInputElement>(".search-input")?.focus();
    }, 0);
  }

  /** Closes the dropdown panel. */
  close() {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._searchTerm = "";
    this.#render();
    this.dispatchEvent(new CustomEvent("ars-select:close", { bubbles: true, composed: true }));
  }

  // --- Internal ---

  #getFilteredOptions(): ArsSelectOption[] {
    if (!this._searchTerm) return this._options;
    const term = this._searchTerm.toLowerCase();
    return this._options.filter(
      (o) => o.label.toLowerCase().includes(term) || o.value.toLowerCase().includes(term),
    );
  }

  #getDisplayLabel(): string {
    if (this.multiple) {
      const vals = this.value as string[];
      if (vals.length === 0) return this.placeholder;
      const labels = this._options.filter((o) => vals.includes(o.value)).map((o) => o.label);
      return labels.join(", ");
    }
    const selected = this._options.find((o) => o.value === this.value);
    return selected?.label ?? this.placeholder;
  }

  #selectOption(opt: ArsSelectOption) {
    if (opt.disabled) return;
    if (this.multiple) {
      const vals = [...(this.value as string[])];
      const idx = vals.indexOf(opt.value);
      if (idx >= 0) vals.splice(idx, 1);
      else vals.push(opt.value);
      this.value = vals;
    } else {
      this.value = opt.value;
      this.close();
    }
  }

  #render() {
    if (!this.shadowRoot) return;

    const labelText = this.getAttribute("label") ?? "";
    const errorText = this.error;
    const hasError = errorText.length > 0;
    const isOpen = this._isOpen;
    const displayLabel = this.#getDisplayLabel();
    const filtered = this.#getFilteredOptions();
    const currentValue = this.value;
    const isMultiple = this.multiple;
    const isSearchable = this.searchable;

    const isSelected = (opt: ArsSelectOption) =>
      isMultiple
        ? (currentValue as string[]).includes(opt.value)
        : currentValue === opt.value;

    const optionsHtml = filtered
      .map(
        (opt, i) => `<div class="option ${isSelected(opt) ? "option--selected" : ""} ${opt.disabled ? "option--disabled" : ""} ${i === this._highlightedIdx ? "option--highlighted" : ""}"
          role="option"
          aria-selected="${String(isSelected(opt))}"
          data-value="${ArsSelect.#escapeAttr(opt.value)}"
          data-index="${i}">
          ${isMultiple && isSelected(opt) ? '<span class="check">&#10003;</span>' : ""}
          ${ArsSelect.#escapeHtml(opt.label)}
          ${opt.group ? `<span class="group-tag">${ArsSelect.#escapeHtml(opt.group)}</span>` : ""}
        </div>`,
      )
      .join("");

    this.shadowRoot.innerHTML = `
      <style>${ArsSelect.#styles()}</style>
      <div class="wrapper">
        ${labelText ? `<label class="label">${ArsSelect.#escapeHtml(labelText)}</label>` : ""}
        <div class="trigger ${hasError ? "trigger--error" : ""} ${isOpen ? "trigger--open" : ""}"
             role="combobox"
             aria-expanded="${String(isOpen)}"
             aria-haspopup="listbox">
          <span class="display-value ${displayLabel === this.placeholder ? "display-value--placeholder" : ""}">${ArsSelect.#escapeHtml(displayLabel)}</span>
          <span class="chevron" aria-hidden="true">${isOpen ? "&#9650;" : "&#9660;"}</span>
        </div>
        ${isOpen ? `
        <div class="dropdown" role="listbox">
          ${isSearchable ? `<input class="search-input" type="text" placeholder="Search..." value="${ArsSelect.#escapeAttr(this._searchTerm)}" aria-label="Filter options">` : ""}
          <div class="options-list">
            ${optionsHtml || '<div class="no-results">No matching options</div>'}
          </div>
        </div>
        ` : ""}
        ${hasError ? `<div class="error-msg" role="alert">${ArsSelect.#escapeHtml(errorText)}</div>` : ""}
      </div>
    `;
  }

  #bindEvents() {
    if (!this.shadowRoot || this._eventsBound) return;
    this._eventsBound = true;

    // Toggle dropdown on trigger click
    this.shadowRoot.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      if (target.closest(".trigger")) {
        if (this._isOpen) this.close();
        else this.open();
        return;
      }

      const optionEl = target.closest("[data-value]") as HTMLElement | null;
      if (optionEl) {
        const value = optionEl.dataset.value ?? "";
        const opt = this._options.find((o) => o.value === value);
        if (opt) this.#selectOption(opt);
      }
    });

    // Search input
    this.shadowRoot.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.classList.contains("search-input")) {
        this._searchTerm = target.value;
        this._highlightedIdx = -1;
        this.#render();
        // Re-focus search after render
        setTimeout(() => {
          const input = this.shadowRoot?.querySelector<HTMLInputElement>(".search-input");
          if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
          }
        }, 0);
      }
    });

    // Keyboard navigation
    this.addEventListener("keydown", (evt) => {
      const e = evt as KeyboardEvent;
      if (this.disabled) return;

      if (!this._isOpen) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          this.open();
        }
        return;
      }

      const filtered = this.#getFilteredOptions();

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          this._highlightedIdx = Math.min(this._highlightedIdx + 1, filtered.length - 1);
          this.#render();
          break;
        case "ArrowUp":
          e.preventDefault();
          this._highlightedIdx = Math.max(this._highlightedIdx - 1, 0);
          this.#render();
          break;
        case "Enter":
          e.preventDefault();
          if (this._highlightedIdx >= 0 && this._highlightedIdx < filtered.length) {
            this.#selectOption(filtered[this._highlightedIdx]);
          }
          break;
        case "Escape":
          e.preventDefault();
          this.close();
          break;
        case "Home":
          e.preventDefault();
          this._highlightedIdx = 0;
          this.#render();
          break;
        case "End":
          e.preventDefault();
          this._highlightedIdx = filtered.length - 1;
          this.#render();
          break;
      }
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (this._isOpen && !this.contains(e.target as Node)) {
        this.close();
      }
    });
  }

  static #escapeHtml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  static #escapeAttr(value: string): string {
    return value.replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }

  static #styles(): string {
    return `
      :host {
        display: block;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
        position: relative;
      }

      :host([disabled]) {
        pointer-events: none;
        opacity: 0.6;
      }

      .wrapper {
        display: flex;
        flex-direction: column;
        gap: var(--arswc-spacing-xs, 4px);
      }

      .label {
        color: var(--arswc-color-text, #1b2430);
        font-size: var(--arswc-font-size-sm, 0.75rem);
        font-weight: 600;
      }

      .trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--arswc-spacing-sm, 8px);
        padding: var(--arswc-spacing-sm, 8px) var(--arswc-spacing-md, 16px);
        border: 1px solid var(--arswc-color-border, #d5dde8);
        border-radius: var(--arswc-radius-sm, 6px);
        background: var(--arswc-color-surface, #f6f8fb);
        cursor: pointer;
        transition: border-color var(--arswc-transition-duration, 200ms) ease;
      }

      .trigger:hover {
        border-color: var(--arswc-color-accent, #2563eb);
      }

      .trigger--open {
        border-color: var(--arswc-color-accent, #2563eb);
        box-shadow: var(--arswc-focus-ring, 0 0 0 3px rgba(37, 99, 235, 0.3));
      }

      .trigger--error {
        border-color: var(--arswc-color-danger, #dc2626);
      }

      .display-value {
        color: var(--arswc-color-text, #1b2430);
        font-size: var(--arswc-font-size-md, 0.875rem);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .display-value--placeholder {
        color: var(--arswc-color-muted, #64748b);
      }

      .chevron {
        font-size: 0.6rem;
        color: var(--arswc-color-muted, #64748b);
        flex-shrink: 0;
      }

      .dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        z-index: 100;
        margin-top: 4px;
        border: 1px solid var(--arswc-color-border, #d5dde8);
        border-radius: var(--arswc-radius-sm, 6px);
        background: var(--arswc-color-surface, #f6f8fb);
        box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        max-height: 240px;
        display: flex;
        flex-direction: column;
      }

      .search-input {
        margin: var(--arswc-spacing-sm, 8px);
        padding: var(--arswc-spacing-xs, 4px) var(--arswc-spacing-sm, 8px);
        border: 1px solid var(--arswc-color-border, #d5dde8);
        border-radius: var(--arswc-radius-sm, 6px);
        font-size: var(--arswc-font-size-md, 0.875rem);
        font-family: inherit;
        outline: none;
        background: var(--arswc-color-bg, #ffffff);
        color: var(--arswc-color-text, #1b2430);
      }

      .search-input:focus {
        border-color: var(--arswc-color-accent, #2563eb);
      }

      .options-list {
        overflow-y: auto;
        flex: 1;
      }

      .option {
        padding: var(--arswc-spacing-sm, 8px) var(--arswc-spacing-md, 16px);
        cursor: pointer;
        font-size: var(--arswc-font-size-md, 0.875rem);
        color: var(--arswc-color-text, #1b2430);
        display: flex;
        align-items: center;
        gap: var(--arswc-spacing-sm, 8px);
        transition: background var(--arswc-transition-duration, 200ms) ease;
      }

      .option:hover {
        background: var(--arswc-color-border, #d5dde8);
      }

      .option--selected {
        background: color-mix(in srgb, var(--arswc-color-accent, #2563eb) 10%, transparent);
        font-weight: 600;
      }

      .option--highlighted {
        background: var(--arswc-color-border, #d5dde8);
      }

      .option--disabled {
        color: var(--arswc-color-disabled, #9ca3af);
        cursor: not-allowed;
      }

      .check {
        color: var(--arswc-color-accent, #2563eb);
        font-weight: bold;
      }

      .group-tag {
        margin-left: auto;
        font-size: var(--arswc-font-size-sm, 0.75rem);
        color: var(--arswc-color-muted, #64748b);
      }

      .no-results {
        padding: var(--arswc-spacing-md, 16px);
        text-align: center;
        color: var(--arswc-color-muted, #64748b);
        font-size: var(--arswc-font-size-md, 0.875rem);
      }

      .error-msg {
        color: var(--arswc-color-danger, #dc2626);
        font-size: var(--arswc-font-size-sm, 0.75rem);
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-select")) {
  customElements.define("ars-select", ArsSelect);
}

export { ArsSelect, ArsSelect as default };
export type { ArsSelectOption as ArsSelectOptionType };
