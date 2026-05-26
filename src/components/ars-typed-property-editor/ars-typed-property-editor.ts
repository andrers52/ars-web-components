// <ars-typed-property-editor> — A type-aware property editor that renders
// the right input widget for each property based on a wire-type tag.
//
// Properties:
//   properties — Record<string, string> (read/write)
//   types      — Record<string, string> mapping property keys to type tags
//                ("string", "email", "date", "time", "number", "url", "tel")
//   readonly   — boolean, disables all inputs
//
// Events:
//   ars-typed-property-editor:change — composed CustomEvent with detail { properties }

export interface TypedPropertyEditorProperties {
  [key: string]: string;
}

export interface TypedPropertyEditorTypes {
  [key: string]: string;
}

class ArsTypedPropertyEditor extends HTMLElement {
  private _properties: TypedPropertyEditorProperties = {};
  private _types: TypedPropertyEditorTypes = {};

  static get observedAttributes() {
    return ["readonly"];
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

  get readonly(): boolean {
    return this.hasAttribute("readonly");
  }

  set readonly(value: boolean) {
    this.toggleAttribute("readonly", !!value);
  }

  get properties(): TypedPropertyEditorProperties {
    return { ...this._properties };
  }

  set properties(value: TypedPropertyEditorProperties) {
    this._properties =
      value && typeof value === "object" && !Array.isArray(value)
        ? { ...value }
        : {};
    if (this.shadowRoot) {
      this.#render();
    }
  }

  get types(): TypedPropertyEditorTypes {
    return { ...this._types };
  }

  set types(value: TypedPropertyEditorTypes) {
    this._types =
      value && typeof value === "object" && !Array.isArray(value)
        ? { ...value }
        : {};
    if (this.shadowRoot) {
      this.#render();
    }
  }

  // --- Internal rendering ---

  #render() {
    if (!this.shadowRoot) {
      return;
    }

    const entries = Object.entries(this._properties);
    const isReadonly = this.readonly;

    const rowsMarkup = entries.length
      ? entries
          .map(([key, value]) => this.#rowMarkup(key, value, isReadonly))
          .join("")
      : isReadonly
        ? `<div class="empty">No properties.</div>`
        : "";

    this.shadowRoot.innerHTML = `
      <style>${ArsTypedPropertyEditor.#styles()}</style>
      <div class="editor">
        <div class="property-list">
          ${rowsMarkup}
        </div>
      </div>
    `;

    if (!isReadonly) {
      for (const input of Array.from(
        this.shadowRoot.querySelectorAll<HTMLInputElement>(".typed-input"),
      )) {
        input.addEventListener("input", () => {
          this.#syncPropertiesFromDOM();
        });
      }
    }
  }

  #rowMarkup(key: string, value: string, readonly: boolean): string {
    const safeKey = ArsTypedPropertyEditor.#escapeHtml(key);
    const safeValue = ArsTypedPropertyEditor.#escapeHtml(value);
    const typeTag = this._types[key] ?? "string";
    const inputId = this.#fieldId(key, value);

    let inputType = "text";
    let extraAttr = "";
    switch (typeTag) {
      case "email":
        inputType = "email";
        break;
      case "date":
        inputType = "date";
        break;
      case "time":
        inputType = "time";
        break;
      case "number":
        inputType = "number";
        break;
      case "url":
        inputType = "url";
        break;
      case "tel":
        inputType = "tel";
        break;
      default:
        inputType = "text";
    }

    if (inputType === "date" || inputType === "time") {
      extraAttr = ' style="color-scheme:dark;"';
    }

    const labelText =
      safeKey.toLowerCase() === "has_name" ? "Name" : safeKey;

    return `
      <div class="property-row" data-prop-key="${safeKey}">
        <label for="${inputId}">${ArsTypedPropertyEditor.#escapeHtml(labelText)}</label>
        <input id="${inputId}" type="${inputType}" value="${safeValue}" class="typed-input" ${readonly ? "readonly" : ""}${extraAttr}>
      </div>
    `;
  }

  #syncPropertiesFromDOM() {
    if (!this.shadowRoot) {
      return;
    }
    const properties: TypedPropertyEditorProperties = {};
    for (const row of Array.from(
      this.shadowRoot.querySelectorAll(".property-row"),
    )) {
      const key = (row as HTMLElement).dataset["propKey"] ?? "";
      const input = row.querySelector<HTMLInputElement>(".typed-input");
      if (key && input) {
        properties[key] = input.value.trim();
      }
    }
    this._properties = properties;
    this.dispatchEvent(
      new CustomEvent("ars-typed-property-editor:change", {
        bubbles: true,
        composed: true,
        detail: { properties: { ...properties } },
      }),
    );
  }

  #fieldId(key: string, value: string): string {
    const rawId = `prop-${key}-${value}-${Math.random().toString(36).slice(2, 7)}`
      .toLowerCase()
      .replaceAll(/[^a-z0-9_-]+/g, "-")
      .replaceAll(/-+/g, "-")
      .replaceAll(/^-|-$/g, "");
    return rawId || "prop-field";
  }

  static #escapeHtml(value: unknown): string {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  static #styles(): string {
    return `
      :host {
        display: block;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
      }

      .editor {
        display: grid;
        gap: var(--arswc-spacing-md, 12px);
      }

      .property-list {
        display: grid;
        gap: var(--arswc-spacing-md, 12px);
      }

      .property-row {
        display: grid;
        gap: var(--arswc-spacing-xs, 4px);
      }

      label {
        color: var(--arswc-color-muted, #64748b);
        font-size: var(--arswc-font-size-sm, 0.75rem);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      input {
        width: 100%;
        box-sizing: border-box;
        min-width: 0;
        padding: var(--arswc-spacing-sm, 8px) var(--arswc-spacing-md, 16px);
        border: 1px solid var(--arswc-color-border, #d5dde8);
        border-radius: var(--arswc-radius-sm, 6px);
        background: var(--arswc-color-bg, #ffffff);
        color: var(--arswc-color-text, #1b2430);
        font: inherit;
      }

      input:focus-visible {
        outline: none;
        border-color: var(--arswc-color-accent, #2563eb);
        box-shadow: var(--arswc-focus-ring, 0 0 0 3px rgba(37, 99, 235, 0.3));
      }

      input:read-only {
        background: var(--arswc-color-disabled-bg, #f3f4f6);
        color: var(--arswc-color-disabled, #9ca3af);
      }

      .empty {
        color: var(--arswc-color-muted, #64748b);
        font-size: var(--arswc-font-size-sm, 0.75rem);
        padding: var(--arswc-spacing-sm, 8px) 0;
      }
    `;
  }
}

if (
  typeof customElements !== "undefined" &&
  !customElements.get("ars-typed-property-editor")
) {
  customElements.define("ars-typed-property-editor", ArsTypedPropertyEditor);
}

export { ArsTypedPropertyEditor, ArsTypedPropertyEditor as default };
