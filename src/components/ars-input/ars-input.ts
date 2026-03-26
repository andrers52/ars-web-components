// <ars-input> — A text input with label, validation feedback, and clearable state.
//
// Uses a native <input> inside Shadow DOM for full keyboard/IME/autocomplete/
// accessibility support. Label is rendered as <label> linked via for/id.
//
// Attributes:
//   type        — "text"|"number"|"email"|"password"|"search"|"url"|"tel"
//   value       — current value
//   placeholder — placeholder text
//   label       — visible label text
//   error       — validation error message string
//   disabled    — boolean
//   readonly    — boolean
//   clearable   — boolean, shows clear button when value is non-empty
//   min, max, step, pattern, required — forwarded to native input
//
// Slots:
//   prefix — icon/text before input
//   suffix — icon/text after input
//
// Properties:
//   value    — read/write string
//   validity — read-only, mirrors native ValidityState
//
// Events:
//   ars-input:change — on commit (blur or enter)
//   ars-input:input  — on every keystroke
//   ars-input:clear  — when clearable X is clicked

export type ArsInputType = "text" | "number" | "email" | "password" | "search" | "url" | "tel";

class ArsInput extends HTMLElement {
  private _value = "";
  private _eventsBound = false;

  static get observedAttributes() {
    return [
      "type", "value", "placeholder", "label", "error",
      "disabled", "readonly", "clearable",
      "min", "max", "step", "pattern", "required",
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open", delegatesFocus: true });
  }

  connectedCallback() {
    this.#render();
    this.#bindEvents();
  }

  attributeChangedCallback(name: string) {
    if (name === "value") {
      this._value = this.getAttribute("value") ?? "";
    }
    if (this.shadowRoot && this._eventsBound) {
      // Preserve current value across re-renders for non-value attribute changes
      const nativeInput = this.shadowRoot.querySelector("input");
      if (nativeInput && name !== "value") {
        this._value = nativeInput.value;
      }
      this.#render();
    }
  }

  // --- Property accessors ---

  get value(): string {
    const nativeInput = this.shadowRoot?.querySelector("input");
    return nativeInput?.value ?? this._value;
  }

  set value(val: string) {
    this._value = val;
    const nativeInput = this.shadowRoot?.querySelector("input");
    if (nativeInput) {
      nativeInput.value = val;
    }
    this.setAttribute("value", val);
  }

  get validity(): ValidityState | undefined {
    return this.shadowRoot?.querySelector("input")?.validity;
  }

  get inputType(): ArsInputType {
    return (this.getAttribute("type") as ArsInputType) || "text";
  }

  set inputType(val: ArsInputType) {
    this.setAttribute("type", val);
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(val: boolean) {
    this.toggleAttribute("disabled", val);
  }

  get error(): string {
    return this.getAttribute("error") ?? "";
  }

  set error(val: string) {
    if (val) {
      this.setAttribute("error", val);
    } else {
      this.removeAttribute("error");
    }
  }

  // --- Rendering ---

  #render() {
    if (!this.shadowRoot) return;

    const id = "ars-input-field";
    const errorId = "ars-input-error";
    const labelText = this.getAttribute("label") ?? "";
    const errorText = this.getAttribute("error") ?? "";
    const placeholder = this.getAttribute("placeholder") ?? "";
    const isDisabled = this.hasAttribute("disabled");
    const isReadonly = this.hasAttribute("readonly");
    const isClearable = this.hasAttribute("clearable");
    const isRequired = this.hasAttribute("required");
    const type = this.inputType;
    const hasError = errorText.length > 0;

    // Forward native constraint attrs
    const min = this.getAttribute("min");
    const max = this.getAttribute("max");
    const step = this.getAttribute("step");
    const pattern = this.getAttribute("pattern");

    const nativeAttrs = [
      `type="${type}"`,
      `id="${id}"`,
      `class="input ${hasError ? "input--error" : ""}"`,
      placeholder ? `placeholder="${ArsInput.#escapeAttr(placeholder)}"` : "",
      `value="${ArsInput.#escapeAttr(this._value)}"`,
      isDisabled ? "disabled" : "",
      isReadonly ? "readonly" : "",
      isRequired ? "required" : "",
      hasError ? `aria-invalid="true" aria-describedby="${errorId}"` : "",
      min !== null ? `min="${ArsInput.#escapeAttr(min)}"` : "",
      max !== null ? `max="${ArsInput.#escapeAttr(max)}"` : "",
      step !== null ? `step="${ArsInput.#escapeAttr(step)}"` : "",
      pattern !== null ? `pattern="${ArsInput.#escapeAttr(pattern)}"` : "",
    ].filter(Boolean).join(" ");

    this.shadowRoot.innerHTML = `
      <style>${ArsInput.#styles()}</style>
      <div class="wrapper">
        ${labelText ? `<label for="${id}" class="label">${ArsInput.#escapeHtml(labelText)}</label>` : ""}
        <div class="input-row">
          <slot name="prefix"></slot>
          <input ${nativeAttrs}>
          ${isClearable && this._value ? '<button type="button" class="clear-btn" aria-label="Clear" tabindex="-1">&times;</button>' : ""}
          <slot name="suffix"></slot>
        </div>
        ${hasError ? `<div id="${errorId}" class="error-msg" role="alert">${ArsInput.#escapeHtml(errorText)}</div>` : ""}
      </div>
    `;
  }

  #bindEvents() {
    if (!this.shadowRoot || this._eventsBound) return;
    this._eventsBound = true;

    // Delegate events from shadow root
    this.shadowRoot.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName !== "INPUT") return;
      this._value = target.value;
      this.dispatchEvent(new CustomEvent("ars-input:input", {
        bubbles: true, composed: true,
        detail: { value: target.value },
      }));
      // Re-render to update clear button visibility
      if (this.hasAttribute("clearable")) this.#render();
    });

    this.shadowRoot.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName !== "INPUT") return;
      this._value = target.value;
      this.dispatchEvent(new CustomEvent("ars-input:change", {
        bubbles: true, composed: true,
        detail: { value: target.value },
      }));
    });

    this.shadowRoot.addEventListener("keydown", (evt) => {
      const e = evt as KeyboardEvent;
      const target = e.target as HTMLInputElement;
      if (target.tagName !== "INPUT") return;
      if (e.key === "Enter") {
        this._value = target.value;
        this.dispatchEvent(new CustomEvent("ars-input:change", {
          bubbles: true, composed: true,
          detail: { value: target.value },
        }));
      }
    });

    this.shadowRoot.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("clear-btn")) {
        this._value = "";
        this.#render();
        this.dispatchEvent(new CustomEvent("ars-input:clear", {
          bubbles: true, composed: true,
          detail: { previousValue: this._value },
        }));
        // Focus back on input
        this.shadowRoot?.querySelector("input")?.focus();
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

      .input-row {
        display: flex;
        align-items: center;
        gap: var(--arswc-spacing-xs, 4px);
        border: 1px solid var(--arswc-color-border, #d5dde8);
        border-radius: var(--arswc-radius-sm, 6px);
        background: var(--arswc-color-surface, #f6f8fb);
        padding: 0 var(--arswc-spacing-sm, 8px);
        transition: border-color var(--arswc-transition-duration, 200ms) ease,
                    box-shadow var(--arswc-transition-duration, 200ms) ease;
      }

      .input-row:focus-within {
        border-color: var(--arswc-color-accent, #2563eb);
        box-shadow: var(--arswc-focus-ring, 0 0 0 3px rgba(37, 99, 235, 0.3));
      }

      :host([disabled]) .input-row {
        background: var(--arswc-color-disabled-bg, #f3f4f6);
        opacity: 0.6;
      }

      .input {
        flex: 1;
        min-width: 0;
        border: none;
        background: transparent;
        color: var(--arswc-color-text, #1b2430);
        font-family: inherit;
        font-size: var(--arswc-font-size-md, 0.875rem);
        padding: var(--arswc-spacing-sm, 8px) 0;
        outline: none;
      }

      .input::placeholder {
        color: var(--arswc-color-muted, #64748b);
      }

      .input--error {
        color: var(--arswc-color-danger, #dc2626);
      }

      :host([error]) .input-row {
        border-color: var(--arswc-color-danger, #dc2626);
      }

      .error-msg {
        color: var(--arswc-color-danger, #dc2626);
        font-size: var(--arswc-font-size-sm, 0.75rem);
      }

      .clear-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border: none;
        background: transparent;
        color: var(--arswc-color-muted, #64748b);
        font-size: 1rem;
        cursor: pointer;
        border-radius: 50%;
        padding: 0;
        line-height: 1;
      }

      .clear-btn:hover {
        color: var(--arswc-color-text, #1b2430);
        background: var(--arswc-color-border, #d5dde8);
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-input")) {
  customElements.define("ars-input", ArsInput);
}

export { ArsInput, ArsInput as default };
