// <ars-property-editor> — A reusable key/value property editor with dynamic
// add/remove rows. Useful for metadata editors, config panels, tag editors,
// and graph node property sheets.
//
// Attributes:
//   readonly — boolean, disables all inputs and hides the add/remove controls
//
// Properties:
//   properties — Record<string, string> (read/write; mutations trigger re-render)
//
// Events:
//   ars-property-editor:change — composed CustomEvent with detail { properties }

class ArsPropertyEditor extends HTMLElement {
  private _properties: Record<string, string> = {};

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

  // --- Property accessors ---

  get readonly(): boolean {
    return this.hasAttribute("readonly");
  }

  set readonly(value: boolean) {
    this.toggleAttribute("readonly", value);
  }

  get properties(): Record<string, string> {
    return { ...this._properties };
  }

  set properties(value: Record<string, string>) {
    this._properties =
      value && typeof value === "object" && !Array.isArray(value)
        ? { ...value }
        : {};
    if (this.shadowRoot) {
      this.#render();
    }
  }

  // --- Public API ---

  addProperty(key = "", value = ""): void {
    const container = this.shadowRoot?.querySelector<HTMLElement>(".property-list");
    if (!container) {
      return;
    }
    const empty = container.querySelector(".empty");
    if (empty) {
      empty.remove();
    }
    const row = this.#createRow(key, value);
    container.appendChild(row);
    this.#syncPropertiesFromDOM();
  }

  removeProperty(key: string): void {
    if (!this.shadowRoot) {
      return;
    }
    for (const row of Array.from(this.shadowRoot.querySelectorAll(".property-row"))) {
      const keyInput = row.querySelector<HTMLInputElement>(".prop-key");
      if (keyInput?.value.trim() === key) {
        row.remove();
        break;
      }
    }
    this.#syncPropertiesFromDOM();
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
      <style>${ArsPropertyEditor.#styles()}</style>
      <div class="editor">
        <div class="property-toolbar">
          <span class="toolbar-label">Properties</span>
          ${isReadonly ? "" : `<button type="button" class="add-btn">Add Property</button>`}
        </div>
        <div class="property-list">
          ${rowsMarkup}
        </div>
      </div>
    `;

    if (!isReadonly) {
      const addBtn = this.shadowRoot.querySelector<HTMLButtonElement>(".add-btn");
      addBtn?.addEventListener("click", () => {
        const container = this.shadowRoot?.querySelector<HTMLElement>(".property-list");
        if (container) {
          const empty = container.querySelector(".empty");
          if (empty) {
            empty.remove();
          }
          const row = this.#createRow("", "");
          container.appendChild(row);
          this.#syncPropertiesFromDOM();
        }
      });

      for (const removeBtn of Array.from(
        this.shadowRoot.querySelectorAll<HTMLButtonElement>(".remove-property-btn"),
      )) {
        removeBtn.addEventListener("click", () => {
          removeBtn.closest(".property-row")?.remove();
          this.#syncPropertiesFromDOM();
        });
      }

      for (const input of Array.from(
        this.shadowRoot.querySelectorAll<HTMLInputElement>(".prop-key, .prop-value"),
      )) {
        input.addEventListener("input", () => {
          this.#syncPropertiesFromDOM();
        });
      }
    }
  }

  #rowMarkup(key: string, value: string, readonly: boolean): string {
    const safeKey = ArsPropertyEditor.#escapeHtml(key);
    const safeValue = ArsPropertyEditor.#escapeHtml(value);
    const keyId = this.#fieldId("key", key, value);
    const valId = this.#fieldId("value", key, value);
    return `
      <div class="property-row">
        <input id="${keyId}" type="text" class="prop-key" placeholder="Key" value="${safeKey}" ${readonly ? "readonly" : ""}>
        <input id="${valId}" type="text" class="prop-value" placeholder="Value" value="${safeValue}" ${readonly ? "readonly" : ""}>
        ${readonly ? "" : `<button type="button" class="remove-property-btn" aria-label="Remove property">Remove</button>`}
      </div>
    `;
  }

  #createRow(key: string, value: string): HTMLElement {
    const row = document.createElement("div");
    row.className = "property-row";

    const safeKey = ArsPropertyEditor.#escapeHtml(key);
    const safeValue = ArsPropertyEditor.#escapeHtml(value);
    const keyId = this.#fieldId("key", key, value);
    const valId = this.#fieldId("value", key, value);
    const readonlyAttr = this.readonly ? "readonly" : "";
    const removeBtn = this.readonly
      ? ""
      : `<button type="button" class="remove-property-btn" aria-label="Remove property">Remove</button>`;

    row.innerHTML = `
      <input id="${keyId}" type="text" class="prop-key" placeholder="Key" value="${safeKey}" ${readonlyAttr}>
      <input id="${valId}" type="text" class="prop-value" placeholder="Value" value="${safeValue}" ${readonlyAttr}>
      ${removeBtn}
    `;

    if (!this.readonly) {
      row
        .querySelector<HTMLButtonElement>(".remove-property-btn")
        ?.addEventListener("click", () => {
          row.remove();
          this.#syncPropertiesFromDOM();
        });

      for (const input of Array.from(
        row.querySelectorAll<HTMLInputElement>(".prop-key, .prop-value"),
      )) {
        input.addEventListener("input", () => {
          this.#syncPropertiesFromDOM();
        });
      }
    }

    return row;
  }

  #syncPropertiesFromDOM() {
    if (!this.shadowRoot) {
      return;
    }
    const properties: Record<string, string> = {};
    for (const row of Array.from(this.shadowRoot.querySelectorAll(".property-row"))) {
      const key =
        (row.querySelector(".prop-key") as HTMLInputElement | null)?.value.trim() || "";
      const value =
        (row.querySelector(".prop-value") as HTMLInputElement | null)?.value.trim() || "";
      if (key) {
        properties[key] = value;
      }
    }
    this._properties = properties;
    this.dispatchEvent(
      new CustomEvent("ars-property-editor:change", {
        bubbles: true,
        composed: true,
        detail: { properties: { ...properties } },
      }),
    );
  }

  #fieldId(field: "key" | "value", key: string, value: string): string {
    const rawId = `${field}-${key}-${value}-${Math.random().toString(36).slice(2, 7)}`
      .toLowerCase()
      .replaceAll(/[^a-z0-9_-]+/g, "-")
      .replaceAll(/-+/g, "-")
      .replaceAll(/^-|-$/g, "");
    return rawId || `${field}-property`;
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
        gap: var(--arswc-spacing-sm, 8px);
      }

      .property-toolbar {
        display: flex;
        justify-content: space-between;
        gap: var(--arswc-spacing-sm, 8px);
        align-items: center;
      }

      .toolbar-label {
        color: var(--arswc-color-muted, #64748b);
        font-size: var(--arswc-font-size-sm, 0.75rem);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .property-list {
        display: grid;
        gap: var(--arswc-spacing-sm, 8px);
      }

      .property-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
        gap: var(--arswc-spacing-sm, 8px);
        align-items: center;
      }

      input {
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

      .add-btn,
      .remove-property-btn {
        border: 1px solid var(--arswc-color-border, #d5dde8);
        border-radius: 999px;
        padding: var(--arswc-spacing-sm, 8px) var(--arswc-spacing-md, 16px);
        background: var(--arswc-color-surface, #f6f8fb);
        color: var(--arswc-color-text, #1b2430);
        cursor: pointer;
        font: inherit;
        font-size: var(--arswc-font-size-sm, 0.75rem);
      }

      .add-btn:hover,
      .remove-property-btn:hover {
        background: var(--arswc-color-bg, #ffffff);
        border-color: var(--arswc-color-accent, #2563eb);
      }

      .remove-property-btn {
        border-color: color-mix(in srgb, var(--arswc-color-danger, #dc2626) 40%, transparent);
        color: var(--arswc-color-danger, #dc2626);
      }

      .remove-property-btn:hover {
        background: color-mix(in srgb, var(--arswc-color-danger, #dc2626) 10%, transparent);
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
  !customElements.get("ars-property-editor")
) {
  customElements.define("ars-property-editor", ArsPropertyEditor);
}

export { ArsPropertyEditor, ArsPropertyEditor as default };
