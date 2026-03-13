export interface ArsRelationalNodeProperty {
  key: string;
  value: string;
}

export interface ArsRelationalNodeData {
  id?: string;
  title?: string;
  subtitle?: string;
  accentColor?: string;
  properties?: Record<string, unknown> | ArsRelationalNodeProperty[];
}

class ArsRelationalNode extends HTMLElement {
  private _data: ArsRelationalNodeData = {};
  private _activationEventsBound = false;

  static get observedAttributes() {
    return ["title", "subtitle", "selected", "dragging", "accent-color", "node-id"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#bindActivationEvents();
  }

  attributeChangedCallback() {
    this.#render();
  }

  get data(): ArsRelationalNodeData {
    return { ...this._data };
  }

  set data(value: ArsRelationalNodeData) {
    this._data = { ...value };
    this.#render();
  }

  // This method exposes selection changes to host apps without forcing them to manipulate attributes directly.
  setSelected(isSelected: boolean) {
    this.toggleAttribute("selected", isSelected);
  }

  // This method exposes drag state so hosts can reflect movement without re-rendering external wrappers.
  setDragging(isDragging: boolean) {
    this.toggleAttribute("dragging", isDragging);
  }

  // This method reports the card's intrinsic border-box height so host layouts do not confuse stretched containers with content growth.
  measureIntrinsicHeight(): number {
    if (!this.shadowRoot) {
      return 0;
    }

    const card = this.shadowRoot.querySelector(".card") as HTMLElement | null;
    const header = this.shadowRoot.querySelector(".header") as HTMLElement | null;
    const content = this.shadowRoot.querySelector(".content") as HTMLElement | null;
    if (!card || !header || !content) {
      return 0;
    }

    const cardStyle = getComputedStyle(card);
    const borderTop = Number.parseFloat(cardStyle.borderTopWidth || "0") || 0;
    const borderBottom = Number.parseFloat(cardStyle.borderBottomWidth || "0") || 0;
    return Math.ceil(header.scrollHeight + content.scrollHeight + borderTop + borderBottom);
  }

  static #escapeHtml(value: unknown): string {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // This method normalizes either record-based or array-based property payloads into a single render shape.
  static #normalizeProperties(properties: ArsRelationalNodeData["properties"]): ArsRelationalNodeProperty[] {
    if (Array.isArray(properties)) {
      return properties.map((property) => ({
        key: String(property.key ?? ""),
        value: String(property.value ?? ""),
      }));
    }
    if (!properties) {
      return [];
    }
    return Object.entries(properties).map(([key, value]) => ({
      key,
      value: String(value ?? ""),
    }));
  }

  // This method merges property data with attributes so host frameworks can choose either integration style.
  #getViewModel() {
    const title = this._data.title ?? this.getAttribute("title") ?? this._data.id ?? this.getAttribute("node-id") ?? "";
    const subtitle = this._data.subtitle ?? this.getAttribute("subtitle") ?? "";
    const accentColor = this._data.accentColor ?? this.getAttribute("accent-color") ?? "var(--arswc-color-accent, #4cc2ff)";
    return {
      id: this._data.id ?? this.getAttribute("node-id") ?? "",
      title,
      subtitle,
      accentColor,
      properties: ArsRelationalNode.#normalizeProperties(this._data.properties),
      isSelected: this.hasAttribute("selected"),
      isDragging: this.hasAttribute("dragging"),
    };
  }

  // This method redraws the full shadow DOM because the card is small and host updates are infrequent.
  #render() {
    if (!this.shadowRoot) {
      return;
    }
    const viewModel = this.#getViewModel();
    const propertiesHtml = viewModel.properties.length > 0
      ? viewModel.properties
          .map(
            (property) => `
              <div class="property-row">
                <span class="property-key">${ArsRelationalNode.#escapeHtml(property.key)}</span>
                <span class="property-value">${ArsRelationalNode.#escapeHtml(property.value)}</span>
              </div>
            `,
          )
          .join("")
      : `<div class="empty-state">No properties</div>`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          color: var(--arswc-color-text, #ecf3ff);
          font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
        }

        .card {
          display: flex;
          flex-direction: column;
          /* Brainiac projects relational nodes into explicit DOM rectangles, so the visible card must fill that host box. */
          min-height: 100%;
          height: 100%;
          box-sizing: border-box;
          overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--arswc-color-border, #3a4d69) 84%, transparent);
          border-radius: calc(var(--arswc-radius-md, 12px) + 2px);
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--arswc-color-surface, #132033) 94%, white 6%), var(--arswc-color-surface, #132033));
          box-shadow: var(--arswc-shadow-sm, 0 8px 20px rgb(0 0 0 / 0.24));
          transition:
            transform 140ms ease,
            box-shadow 140ms ease,
            border-color 140ms ease;
        }

        .card[data-selected="true"] {
          border-color: ${viewModel.accentColor};
          box-shadow:
            0 0 0 1px color-mix(in srgb, ${viewModel.accentColor} 50%, transparent),
            0 14px 28px rgb(0 0 0 / 0.32);
        }

        .card[data-dragging="true"] {
          transform: rotate(-0.35deg) translateY(-2px);
          box-shadow:
            0 0 0 1px color-mix(in srgb, ${viewModel.accentColor} 70%, transparent),
            0 18px 32px rgb(0 0 0 / 0.4);
        }

        .header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: start;
          padding: 14px 16px 12px;
          background:
            linear-gradient(90deg, color-mix(in srgb, ${viewModel.accentColor} 22%, transparent), transparent 58%),
            color-mix(in srgb, var(--arswc-color-surface, #132033) 90%, black 10%);
          border-bottom: 1px solid color-mix(in srgb, var(--arswc-color-border, #3a4d69) 74%, transparent);
        }

        .title-block {
          min-width: 0;
        }

        .title {
          margin: 0;
          font-size: 0.98rem;
          font-weight: 700;
          line-height: 1.2;
          color: var(--arswc-color-text, #ecf3ff);
          word-break: break-word;
        }

        .subtitle {
          margin-top: 4px;
          font-size: 0.76rem;
          color: var(--arswc-color-muted, #95aac8);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .node-id {
          flex-shrink: 0;
          max-width: min(46%, 220px);
          padding: 4px 8px;
          border-radius: 999px;
          background: color-mix(in srgb, ${viewModel.accentColor} 18%, transparent);
          color: ${viewModel.accentColor};
          font-family: var(--arswc-font-family-mono, ui-monospace, monospace);
          font-size: 0.72rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .content {
          display: grid;
          gap: 10px;
          padding: 14px 16px 16px;
        }

        .property-row {
          display: grid;
          gap: 4px;
        }

        .property-key {
          color: var(--arswc-color-muted, #95aac8);
          font-size: 0.72rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .property-value {
          color: var(--arswc-color-text, #ecf3ff);
          font-size: 0.88rem;
          line-height: 1.35;
          word-break: break-word;
        }

        .empty-state {
          color: var(--arswc-color-muted, #95aac8);
          font-size: 0.82rem;
          font-style: italic;
        }
      </style>
      <article class="card" data-selected="${String(viewModel.isSelected)}" data-dragging="${String(viewModel.isDragging)}">
        <header class="header">
          <div class="title-block">
            <h3 class="title">${ArsRelationalNode.#escapeHtml(viewModel.title)}</h3>
            <div class="subtitle">${ArsRelationalNode.#escapeHtml(viewModel.subtitle)}</div>
          </div>
          <div class="node-id" title="${ArsRelationalNode.#escapeHtml(viewModel.id)}">${ArsRelationalNode.#escapeHtml(viewModel.id)}</div>
        </header>
        <section class="content">
          ${propertiesHtml}
        </section>
      </article>
    `;
  }

  // This method republishes activation from the shadow tree so host apps can reliably react to real double-clicks.
  #bindActivationEvents() {
    if (!this.shadowRoot || this._activationEventsBound) {
      return;
    }

    this.shadowRoot.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      this.dispatchEvent(new CustomEvent("ars-relational-node:activate", {
        bubbles: true,
        composed: true,
        detail: {
          originalEventType: event.type,
        },
      }));
    });

    this._activationEventsBound = true;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-relational-node")) {
  customElements.define("ars-relational-node", ArsRelationalNode);
}

export { ArsRelationalNode, ArsRelationalNode as default };
