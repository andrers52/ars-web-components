// <ars-toolbar> — A reusable application toolbar / header bar with brand area,
// navigation items, and status indicator.
//
// Attributes:
//   title        — brand title text (default "")
//   subtitle     — brand subtitle text (default "")
//   status       — status text shown in the right pill (default "")
//   active-item  — id of the currently active nav item (default "")
//
// Properties:
//   items        — ArsToolbarItem[] (set via JS only)
//
// Slots:
//   brand-mark   — logo / icon area placed before the title (e.g. a colored badge)
//   status       — custom status content overriding the `status` text property
//
// Events:
//   ars-toolbar:navigate — composed CustomEvent with detail { id }
//
// Slots:
//   actions      — action icons / buttons placed to the right of the status pill

export interface ArsToolbarItem {
  id: string;
  label: string;
}

class ArsToolbar extends HTMLElement {
  private _items: ArsToolbarItem[] = [];

  static get observedAttributes() {
    return ["title", "subtitle", "status", "active-item"];
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

  get title(): string {
    return this.getAttribute("title") || "";
  }

  set title(value: string) {
    this.setAttribute("title", value);
  }

  get subtitle(): string {
    return this.getAttribute("subtitle") || "";
  }

  set subtitle(value: string) {
    this.setAttribute("subtitle", value);
  }

  get status(): string {
    return this.getAttribute("status") || "";
  }

  set status(value: string) {
    this.setAttribute("status", value);
  }

  get activeItem(): string {
    return this.getAttribute("active-item") || "";
  }

  set activeItem(value: string) {
    this.setAttribute("active-item", value);
  }

  get items(): ArsToolbarItem[] {
    return this._items.map((i) => ({ ...i }));
  }

  set items(value: ArsToolbarItem[]) {
    this._items = Array.isArray(value)
      ? value.map((i) => ({ ...i }))
      : [];
    if (this.shadowRoot) {
      this.#render();
    }
  }

  // --- Rendering ---

  #render() {
    if (!this.shadowRoot) {
      return;
    }

    const items = this._items;
    const activeItem = this.activeItem;

    this.shadowRoot.innerHTML = `
      <style>${ArsToolbar.#styles()}</style>
      <section class="toolbar">
        <div class="brand">
          <div class="brand-mark"><slot name="brand-mark"></slot></div>
          <div>
            ${this.title ? `<span class="brand-title">${ArsToolbar.#escapeHtml(this.title)}</span>` : ""}
            ${this.subtitle ? `<span class="brand-subtitle">${ArsToolbar.#escapeHtml(this.subtitle)}</span>` : ""}
          </div>
        </div>
        <nav class="nav" aria-label="Toolbar navigation">
          ${items
            .map(
              (item) =>
                `<button type="button" class="nav-item" data-item-id="${ArsToolbar.#escapeHtml(item.id)}" data-active="${String(item.id === activeItem)}">${ArsToolbar.#escapeHtml(item.label)}</button>`,
            )
            .join("")}
        </nav>
        <div class="trailing">
          ${this.status.trim() ? `<div class="status"><slot name="status">${ArsToolbar.#escapeHtml(this.status)}</slot></div>` : ""}
          <div class="actions">
            <slot name="actions"></slot>
          </div>
        </div>
      </section>
    `;

    for (const button of Array.from(
      this.shadowRoot.querySelectorAll<HTMLButtonElement>("button[data-item-id]"),
    )) {
      button.addEventListener("click", () => {
        const id = button.dataset["itemId"];
        if (!id) {
          return;
        }
        this.dispatchEvent(
          new CustomEvent("ars-toolbar:navigate", {
            bubbles: true,
            composed: true,
            detail: { id },
          }),
        );
      });
    }
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
        width: 100%;
        height: 100%;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
      }

      .toolbar {
        box-sizing: border-box;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: var(--arswc-spacing-md, 16px);
        width: 100%;
        height: 100%;
        padding: 0 var(--arswc-spacing-md, 16px);
        border: 1px solid var(--arswc-color-border, #d5dde8);
        border-radius: var(--arswc-radius-md, 10px);
        background: var(--arswc-color-surface, #f6f8fb);
        color: var(--arswc-color-text, #1b2430);
      }

      .brand {
        display: flex;
        align-items: center;
        gap: var(--arswc-spacing-sm, 8px);
        min-width: 0;
      }

      .brand-mark {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
      }

      .brand-mark:empty {
        display: none;
      }

      .brand-title {
        display: block;
        font-size: var(--arswc-font-size-md, 0.875rem);
        font-weight: 700;
      }

      .brand-subtitle {
        display: block;
        margin-top: 2px;
        color: var(--arswc-color-muted, #64748b);
        font-size: var(--arswc-font-size-sm, 0.75rem);
      }

      .nav {
        display: flex;
        justify-content: center;
        gap: var(--arswc-spacing-sm, 8px);
        flex-wrap: wrap;
      }

      .nav-item {
        border: 1px solid var(--arswc-color-border, #d5dde8);
        border-radius: 999px;
        padding: var(--arswc-spacing-sm, 8px) var(--arswc-spacing-md, 16px);
        background: var(--arswc-color-bg, #ffffff);
        color: var(--arswc-color-text, #1b2430);
        cursor: pointer;
        font: inherit;
        font-size: var(--arswc-font-size-sm, 0.75rem);
        transition: background var(--arswc-transition-duration, 200ms) ease,
                    border-color var(--arswc-transition-duration, 200ms) ease;
      }

      .nav-item:hover {
        background: var(--arswc-color-surface, #f6f8fb);
        border-color: var(--arswc-color-accent, #2563eb);
      }

      .nav-item[data-active="true"] {
        background: linear-gradient(
          180deg,
          var(--arswc-button-primary-bg-start, #3b82f6),
          var(--arswc-button-primary-bg-end, #2563eb)
        );
        color: var(--arswc-button-primary-color, #ffffff);
        border-color: transparent;
      }

      .trailing {
        display: flex;
        align-items: center;
        gap: var(--arswc-spacing-sm, 8px);
        justify-self: end;
      }

      .status {
        max-width: 240px;
        padding: var(--arswc-spacing-sm, 8px) var(--arswc-spacing-md, 16px);
        border: 1px solid var(--arswc-color-border, #d5dde8);
        border-radius: 999px;
        background: var(--arswc-color-bg, #ffffff);
        color: var(--arswc-color-muted, #64748b);
        font-size: var(--arswc-font-size-sm, 0.75rem);
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: var(--arswc-spacing-xs, 4px);
      }

      .actions:empty {
        display: none;
      }

      @media (max-width: 900px) {
        .toolbar {
          grid-template-columns: 1fr;
          justify-items: start;
          align-content: center;
          padding: var(--arswc-spacing-sm, 8px) var(--arswc-spacing-md, 16px);
        }

        .nav {
          justify-content: flex-start;
        }

        .trailing {
          justify-self: stretch;
        }

        .status {
          max-width: none;
          flex: 1 1 auto;
        }
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-toolbar")) {
  customElements.define("ars-toolbar", ArsToolbar);
}

export { ArsToolbar, ArsToolbar as default };
