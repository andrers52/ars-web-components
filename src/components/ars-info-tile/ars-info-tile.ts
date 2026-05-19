// <ars-info-tile> — A structured information display tile.
//
// Renders a card with title, subtitle, accent color header, and a key-value
// property list. Designed to be embedded in dashboards, data visualizations,
// and other composite UI layouts.
//
// Attributes:
//   title         — main heading
//   subtitle      — secondary label (displayed uppercase)
//   tile-id       — identifier badge shown in the header
//   accent-color  — top border and header gradient tint
//   selected      — boolean attribute for selection highlight
//   dragging      — boolean attribute for drag-in-progress state
//   collapsed     — boolean attribute reflecting collapse-toggle state
//   not-collapsible — boolean attribute that HIDES the collapse button
//                     (presence = hidden; absence = visible).  The
//                     attribute name carries the negation because most
//                     tiles SHOULD show the button — defaulting on
//                     button presence avoids host apps having to opt in
//                     on every node.  Use cases: leaves of a hierarchy
//                     (nothing to collapse), single-node graphs, etc.
//
// Properties:
//   data         — { id, title, subtitle, accentColor, properties } object
//   selected     — boolean, when true applies the selection highlight ring
//   collapsed    — boolean, when true renders the toggle button in its
//                  "collapsed" state (caret pointing right). Hosts read
//                  the `ars-info-tile:toggle-collapse` event to react.
//
// Events:
//   ars-info-tile:activate         — fired on double-click (composed, bubbles)
//   ars-info-tile:toggle-collapse  — fired when the user clicks the
//                                    header collapse/expand button.
//                                    `detail.collapsed` carries the
//                                    *requested* next state (NOT yet
//                                    applied — the host decides whether
//                                    to flip the property).

export interface ArsInfoTileProperty {
  key: string;
  value: string;
}

export interface ArsInfoTileData {
  id?: string;
  title?: string;
  subtitle?: string;
  accentColor?: string;
  properties?: Record<string, unknown> | ArsInfoTileProperty[];
}

class ArsInfoTile extends HTMLElement {
  private _data: ArsInfoTileData = {};
  private _activationEventsBound = false;

  static get observedAttributes() {
    return ["title", "subtitle", "selected", "dragging", "collapsed", "not-collapsible", "accent-color", "tile-id"];
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

  get data(): ArsInfoTileData {
    return { ...this._data };
  }

  set data(value: ArsInfoTileData) {
    this._data = { ...value };
    this.#render();
  }

  // Property setter so hosts can toggle selection via
  // `(el as any).selected = true`.  Mirrors the attribute-based path
  // (`setSelected`) so both integration styles work.
  get selected(): boolean {
    return this.hasAttribute("selected");
  }

  set selected(value: boolean) {
    this.setSelected(!!value);
  }

  // Exposes selection changes to host apps without forcing them to manipulate attributes directly.
  setSelected(isSelected: boolean) {
    this.toggleAttribute("selected", isSelected);
  }

  // Exposes drag state so hosts can reflect movement without re-rendering external wrappers.
  setDragging(isDragging: boolean) {
    this.toggleAttribute("dragging", isDragging);
  }

  // Symmetric collapse property — hosts toggle it the same way they do
  // `selected`. The `collapsed` flag is *purely cosmetic* on the tile
  // itself (it flips the toggle-button caret); any application-level
  // effect (e.g. hiding a subtree, adjusting layout) is the host's
  // responsibility.
  get collapsed(): boolean {
    return this.hasAttribute("collapsed");
  }

  set collapsed(value: boolean) {
    this.setCollapsed(!!value);
  }

  setCollapsed(isCollapsed: boolean) {
    this.toggleAttribute("collapsed", isCollapsed);
  }

  // Whether the collapse-toggle button is rendered.  Stored as the
  // negative attribute `not-collapsible` so the default (no attribute
  // present) renders the button — symmetric with how most boolean
  // HTML attributes work (e.g. `disabled` is opt-in for the unusual
  // state).  Hosts set this via `el.collapsible = false` on leaf
  // items; the inverse property name keeps the host API positive
  // ("this tile CAN be collapsed: yes/no") while the attribute stays
  // attribute-namespace correct.
  get collapsible(): boolean {
    return !this.hasAttribute("not-collapsible");
  }

  set collapsible(value: boolean) {
    this.setCollapsible(!!value);
  }

  setCollapsible(isCollapsible: boolean) {
    this.toggleAttribute("not-collapsible", !isCollapsible);
  }

  // Opacity hook for dimming or fading out a tile.  Hosts write
  // through the property setter, which applies the value as an inline
  // style on the element.  Reading the same value back from
  // `getPropertyValue` keeps the getter consistent with what's on the
  // element regardless of who set it (host framework vs. application
  // code).  Range is the standard CSS [0, 1]; values outside are
  // clamped to protect against typo-induced invisibility.
  get opacity(): number {
    const raw = this.style.getPropertyValue("opacity");
    if (raw === "") return 1;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 1;
  }

  set opacity(value: number) {
    const clamped = Math.max(0, Math.min(1, Number(value)));
    if (!Number.isFinite(clamped) || clamped === 1) {
      // Treat 1 (or invalid) as the default — remove the inline
      // style so the element returns to whatever the cascade dictates.
      this.style.removeProperty("opacity");
    } else {
      this.style.setProperty("opacity", String(clamped));
    }
  }

  // Reports the card's intrinsic border-box height so host layouts do not confuse stretched containers with content growth.
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

  // Normalizes either record-based or array-based property payloads into a single render shape.
  // Filters out "title" (already shown in the header) and sorts keys logically
  // (STARTS_AT before ENDS_AT, alphabetical otherwise).
  static #normalizeProperties(properties: ArsInfoTileData["properties"]): ArsInfoTileProperty[] {
    const raw: ArsInfoTileProperty[] = Array.isArray(properties)
      ? properties.map((property) => ({
          key: String(property.key ?? ""),
          value: String(property.value ?? ""),
        }))
      : properties
        ? Object.entries(properties).map(([key, value]) => ({
            key,
            value: String(value ?? ""),
          }))
        : [];

    // Filter out "title" — already displayed in the header
    const filtered = raw.filter((p) => p.key.toLowerCase() !== "title");

    // Sort: STARTS_AT before ENDS_AT, alphabetical otherwise
    filtered.sort((a, b) => {
      const aUpper = a.key.toUpperCase();
      const bUpper = b.key.toUpperCase();
      if (aUpper === "STARTS_AT" && bUpper === "ENDS_AT") return -1;
      if (aUpper === "ENDS_AT" && bUpper === "STARTS_AT") return 1;
      return aUpper.localeCompare(bUpper);
    });

    return filtered;
  }

  // Merges property data with attributes so host frameworks can choose either integration style.
  #getViewModel() {
    const title = this._data.title ?? this.getAttribute("title") ?? this._data.id ?? this.getAttribute("tile-id") ?? "";
    const subtitle = this._data.subtitle ?? this.getAttribute("subtitle") ?? "";
    const accentColor = this._data.accentColor ?? this.getAttribute("accent-color") ?? "var(--arswc-color-accent, #4cc2ff)";
    return {
      id: this._data.id ?? this.getAttribute("tile-id") ?? "",
      title,
      subtitle,
      accentColor,
      properties: ArsInfoTile.#normalizeProperties(this._data.properties),
      isSelected: this.hasAttribute("selected"),
      isDragging: this.hasAttribute("dragging"),
      isCollapsed: this.hasAttribute("collapsed"),
      isCollapsible: !this.hasAttribute("not-collapsible"),
    };
  }

  // Redraws the full shadow DOM because the tile is small and host updates are infrequent.
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
                <span class="property-key">${ArsInfoTile.#escapeHtml(property.key)}</span>
                <span class="property-value">${ArsInfoTile.#escapeHtml(property.value)}</span>
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
          /* The selection cue is intentionally hard to miss — the
             previous 1px @ 50%-alpha ring blended into the dark
             surface and read as "tint", not "selected".  We stack two
             reinforcing signals at full opacity:
               1. Border switches to the accent colour (no transparency).
               2. A 3 px solid accent ring sits outside the border via
                  box-shadow spread.  Rendered OUTSIDE the border-box,
                  so no interior reflow on selection.
             Border-width stays at 1 px to avoid jittering the content
             area (box-sizing: border-box would otherwise shrink the
             inner column by 2 px on toggle). */
          border-color: ${viewModel.accentColor};
          box-shadow:
            0 0 0 3px ${viewModel.accentColor},
            0 14px 28px rgb(0 0 0 / 0.36);
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
          align-items: center;
          gap: 8px;
          padding: 14px 16px 12px;
          background:
            linear-gradient(90deg, color-mix(in srgb, ${viewModel.accentColor} 22%, transparent), transparent 58%),
            color-mix(in srgb, var(--arswc-color-surface, #132033) 90%, black 10%);
          border-bottom: 1px solid color-mix(in srgb, var(--arswc-color-border, #3a4d69) 74%, transparent);
        }

        .title-block {
          text-align: center;
          min-width: 0;
        }

        /* Collapse/expand affordance.  Pure cosmetic — the toggle event
           is delivered to the host, which decides whether to flip the
           'collapsed' property and apply any application-level effects.
           The button is intentionally small and low-contrast so it
           doesn't compete with the tile content. */
        .collapse-btn {
          all: unset;
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 6px;
          color: var(--arswc-color-muted, #95aac8);
          font-size: 0.9rem;
          line-height: 1;
          cursor: pointer;
          border: 1px solid color-mix(in srgb, var(--arswc-color-border, #3a4d69) 64%, transparent);
          background: color-mix(in srgb, var(--arswc-color-surface, #132033) 80%, black 6%);
          transition: background 120ms ease, color 120ms ease, transform 140ms ease;
        }

        .collapse-btn:hover {
          color: var(--arswc-color-text, #ecf3ff);
          background: color-mix(in srgb, ${viewModel.accentColor} 22%, transparent);
        }

        .collapse-btn:focus-visible {
          outline: 2px solid ${viewModel.accentColor};
          outline-offset: 2px;
        }

        /* Caret rotates 90° clockwise when collapsed, so the same
           character renders as either "down/expand" (default) or
           "right/collapsed" without swapping glyphs. */
        .collapse-btn .caret {
          display: inline-block;
          transition: transform 160ms ease;
          transform: rotate(0deg);
        }

        :host([collapsed]) .collapse-btn .caret {
          transform: rotate(-90deg);
        }

        .title {
          margin: 0;
          font-size: 0.98rem;
          font-weight: 700;
          line-height: 1.2;
          color: var(--arswc-color-text, #ecf3ff);
        }

        .subtitle {
          margin-top: 4px;
          font-size: 0.76rem;
          color: var(--arswc-color-muted, #95aac8);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .content {
          display: grid;
          gap: 10px;
          padding: 14px 16px 16px;
          /* Safety net for tiles whose host gives them too little
             vertical room for the number of properties they carry.
             Without this the property rows beyond the card's height
             are hard-clipped (the card has overflow: hidden), which
             silently drops information the user needs.
             flex: 1 1 auto + min-height: 0 lets the content area
             shrink inside the flex column, and overflow-y: auto only
             surfaces a scrollbar when actually needed — short tiles
             render scrollbar-free. */
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
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
      <article class="card" data-selected="${String(viewModel.isSelected)}" data-dragging="${String(viewModel.isDragging)}" data-collapsed="${String(viewModel.isCollapsed)}" data-collapsible="${String(viewModel.isCollapsible)}">
        <header class="header">
          <div class="title-block">
            <h3 class="title">${ArsInfoTile.#escapeHtml(viewModel.title)}</h3>
            <div class="subtitle">${ArsInfoTile.#escapeHtml(viewModel.subtitle)}</div>
          </div>
          ${viewModel.isCollapsible ? `<button
            type="button"
            class="collapse-btn"
            part="collapse-btn"
            aria-pressed="${String(viewModel.isCollapsed)}"
            aria-label="${viewModel.isCollapsed ? "Expand content" : "Collapse content"}"
            title="${viewModel.isCollapsed ? "Expand content" : "Collapse content"}"
          ><span class="caret" aria-hidden="true">▾</span></button>` : ""}
        </header>
        <section class="content">
          ${propertiesHtml}
        </section>
      </article>
    `;
    // Re-bind collapse-button listener after every re-render: `#render`
    // replaces `innerHTML`, which destroys the previous button element.
    // The activation (dblclick) listener attaches at the shadow root and
    // survives re-renders; the button is created fresh each time when
    // the tile is collapsible — `#bindCollapseButton` is a no-op when
    // the button isn't present.
    this.#bindCollapseButton();
  }

  // Republishes activation from the shadow tree so host apps can reliably react to real double-clicks.
  #bindActivationEvents() {
    if (!this.shadowRoot || this._activationEventsBound) {
      return;
    }

    this.shadowRoot.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      this.dispatchEvent(new CustomEvent("ars-info-tile:activate", {
        bubbles: true,
        composed: true,
        detail: {
          originalEventType: event.type,
        },
      }));
    });

    this._activationEventsBound = true;
  }

  // Wire the in-shadow collapse button to a host-bubbling custom event.
  // `detail.collapsed` carries the REQUESTED next state — the host
  // decides whether to flip the property; we do NOT toggle locally so
  // the host stays the single source of truth.
  #bindCollapseButton() {
    if (!this.shadowRoot) {
      return;
    }
    const button = this.shadowRoot.querySelector(".collapse-btn");
    if (!button) {
      return;
    }
    button.addEventListener("click", (event) => {
      // Don't let the click bubble to the document and trip
      // drag-start handlers or other host-level listeners.
      event.stopPropagation();
      const requested = !this.hasAttribute("collapsed");
      this.dispatchEvent(new CustomEvent("ars-info-tile:toggle-collapse", {
        bubbles: true,
        composed: true,
        detail: {
          collapsed: requested,
        },
      }));
    });
    // Stop dblclick on the button from reaching the shadow-root
    // activation listener.  Without this, two fast clicks on the
    // toggle (a natural way to flip-flop collapse state) get
    // promoted to a dblclick and fire an activation event — exactly
    // the wrong outcome for a collapse interaction.  Stops propagation
    // BEFORE the shadow-root listener sees it; the activation event
    // never fires for clicks that originate on the button itself.
    button.addEventListener("dblclick", (event) => {
      event.stopPropagation();
    });
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-info-tile")) {
  customElements.define("ars-info-tile", ArsInfoTile);
}

// Deprecated alias — register the old tag name so existing consumers continue to work during transition.
if (typeof customElements !== "undefined" && !customElements.get("ars-relational-node")) {
  customElements.define("ars-relational-node", class extends ArsInfoTile {});
}

export { ArsInfoTile, ArsInfoTile as default };

// Deprecated re-exports for backwards compatibility.
/** @deprecated Use ArsInfoTileProperty instead. */
export type ArsRelationalNodeProperty = ArsInfoTileProperty;
/** @deprecated Use ArsInfoTileData instead. */
export type ArsRelationalNodeData = ArsInfoTileData;
/** @deprecated Use ArsInfoTile instead. */
export const ArsRelationalNode = ArsInfoTile;
