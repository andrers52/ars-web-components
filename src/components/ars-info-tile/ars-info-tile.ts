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
//   editing       — boolean attribute; when true the tile renders inline
//                   inputs for name and properties so the user can edit
//                   in-place instead of opening a separate dialog.
//   not-collapsible — boolean attribute that HIDES the collapse button
//                     (presence = hidden; absence = visible).  The
//                     attribute name carries the negation because most
//                     tiles SHOULD show the button — defaulting on
//                     button presence avoids host apps having to opt in
//                     on every node.  Use cases: leaves of a hierarchy
//                     (nothing to collapse), single-node graphs, etc.
//
// Properties:
//   data         — { id, title, subtitle, name, accentColor, properties, types } object
//   selected     — boolean, when true applies the selection highlight ring
//   collapsed    — boolean, when true renders the toggle button in its
//                  "collapsed" state (caret pointing right). Hosts read
//                  the `ars-info-tile:toggle-collapse` event to react.
//   editing      — boolean, when true renders inline inputs and save/cancel
//
// Events:
//   ars-info-tile:activate         — fired on double-click (composed, bubbles)
//   ars-info-tile:toggle-collapse  — fired when the user clicks the
//                                    header collapse/expand button.
//                                    `detail.collapsed` carries the
//                                    *requested* next state (NOT yet
//                                    applied — the host decides whether
//                                    to flip the property).
//   ars-info-tile:edit-save        — fired when the user confirms an
//                                    inline edit. Detail: { name?, properties }.
//   ars-info-tile:edit-cancel      — fired when the user cancels inline edit.

export interface ArsInfoTileProperty {
  key: string;
  value: string;
}

export interface ArsInfoTileData {
  id?: string;
  title?: string;
  subtitle?: string;
  name?: string;
  accentColor?: string;
  properties?: Record<string, unknown> | ArsInfoTileProperty[];
  types?: Record<string, string>;
}

class ArsInfoTile extends HTMLElement {
  private _data: ArsInfoTileData = {};
  private _activationEventsBound = false;
  private _editAbortController: AbortController | null = null;

  static get observedAttributes() {
    return [
      "title",
      "subtitle",
      "selected",
      "dragging",
      "collapsed",
      "editing",
      "not-collapsible",
      "accent-color",
      "tile-id",
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#render();
    this.#bindActivationEvents();
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    _newValue: string | null,
  ) {
    // For attributes that only affect data-* attributes on the .card
    // element, update directly without full re-render. This prevents
    // destroying the button element between mousedown and mouseup,
    // which would prevent the browser from generating a click event
    // (mousedown target ≠ mouseup target → no click).
    if (name === "selected" || name === "dragging") {
      this.#updateCardDataAttrs();
      return;
    }
    this.#render();
  }

  get data(): ArsInfoTileData {
    return { ...this._data };
  }

  set data(value: ArsInfoTileData) {
    // Guard: skip re-render when data is structurally identical.
    // The DOMRenderer re-applies ALL properties whenever ANY property
    // changes (e.g. `selected` is toggled). Without this guard,
    // re-setting `data` to the same value triggers #render(), which
    // rebuilds the shadow DOM and destroys the collapse button between
    // mousedown and mouseup — the browser then suppresses the click
    // event (different mousedown/mouseup targets) and the toggle
    // never fires on the first click.
    const newData = { ...value };
    if (JSON.stringify(this._data) === JSON.stringify(newData)) return;
    this._data = newData;
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

  get editing(): boolean {
    return this.hasAttribute("editing");
  }

  set editing(value: boolean) {
    this.toggleAttribute("editing", !!value);
  }

  setEditing(isEditing: boolean) {
    this.toggleAttribute("editing", isEditing);
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
  // `getPropertyValue` keeps the getter consistent with what's on
  // the element regardless of who set it (host framework vs.
  // application code).  Range is the standard CSS [0, 1]; values
  // outside are clamped to protect against typo-induced invisibility.
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
    const header = this.shadowRoot.querySelector(
      ".header",
    ) as HTMLElement | null;
    const content = this.shadowRoot.querySelector(
      ".content",
    ) as HTMLElement | null;
    if (!card || !header || !content) {
      return 0;
    }

    const cardStyle = getComputedStyle(card);
    const borderTop = Number.parseFloat(cardStyle.borderTopWidth || "0") || 0;
    const borderBottom =
      Number.parseFloat(cardStyle.borderBottomWidth || "0") || 0;
    return Math.ceil(
      header.scrollHeight + content.scrollHeight + borderTop + borderBottom,
    );
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
  // Filters out "title" and "HAS_NAME" (already shown in the header or as the dedicated
  // name block) and sorts keys logically (STARTS_AT before ENDS_AT, alphabetical otherwise).
  static #normalizeProperties(
    properties: ArsInfoTileData["properties"],
  ): ArsInfoTileProperty[] {
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

    // Filter out "title" and "HAS_NAME" — already displayed in the header or name block
    const filtered = raw.filter((p) => {
      const lower = p.key.toLowerCase();
      return lower !== "title" && lower !== "has_name";
    });

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

  // Maps a wire-type tag to the HTML <input> type that best suits it.
  // Defined as an instance method to avoid static-private-method access
  // issues across different transpiler/runtime combinations.
  #inferInputType(typeTag: string | undefined): string {
    switch (typeTag) {
      case "email":
        return "email";
      case "date":
        return "date";
      case "time":
        return "time";
      case "number":
        return "number";
      case "url":
        return "url";
      case "tel":
        return "tel";
      default:
        return "text";
    }
  }

  // Merges property data with attributes so host frameworks can choose either integration style.
  #getViewModel() {
    const title =
      this._data.title ??
      this.getAttribute("title") ??
      this._data.id ??
      this.getAttribute("tile-id") ??
      "";
    const subtitle = this._data.subtitle ?? this.getAttribute("subtitle") ?? "";
    const accentColor =
      this._data.accentColor ??
      this.getAttribute("accent-color") ??
      "var(--arswc-color-accent, #4cc2ff)";
    return {
      id: this._data.id ?? this.getAttribute("tile-id") ?? "",
      title,
      subtitle,
      name: this._data.name ?? "",
      accentColor,
      properties: ArsInfoTile.#normalizeProperties(this._data.properties),
      types: this._data.types ?? {},
      isSelected: this.hasAttribute("selected"),
      isDragging: this.hasAttribute("dragging"),
      isCollapsed: this.hasAttribute("collapsed"),
      isCollapsible: !this.hasAttribute("not-collapsible"),
      isEditing: this.hasAttribute("editing"),
    };
  }

  // Update only the data-* attributes on the .card element without
  // tearing down the full shadow DOM.  Used for `selected` and `dragging`
  // changes that are purely cosmetic.  Prevents button destruction between
  // mousedown and mouseup, which would suppress the click event.
  #updateCardDataAttrs(): void {
    const card = this.shadowRoot?.querySelector<HTMLElement>(".card");
    if (!card) return;
    card.setAttribute("data-selected", String(this.hasAttribute("selected")));
    card.setAttribute("data-dragging", String(this.hasAttribute("dragging")));
  }

  // Builds the edit-mode markup for a single property row.
  #renderEditRow(property: ArsInfoTileProperty, typeTag: string): string {
    const safeKey = ArsInfoTile.#escapeHtml(property.key);
    const safeValue = ArsInfoTile.#escapeHtml(property.value);
    const inputType = this.#inferInputType(typeTag);
    const labelText = safeKey.toLowerCase() === "has_name" ? "Name" : safeKey;
    const extraAttr = inputType === "date" || inputType === "time"
      ? ' style="color-scheme:dark;"'
      : "";
    return `
      <div class="edit-row" data-prop-key="${safeKey}">
        <label>${ArsInfoTile.#escapeHtml(labelText)}</label>
        <input type="${inputType}" value="${safeValue}" class="edit-input"${extraAttr}>
      </div>
    `;
  }

  // Redraws the full shadow DOM because the tile is small and host updates are infrequent.
  #render() {
    if (!this.shadowRoot) {
      return;
    }
    const viewModel = this.#getViewModel();

    let headerHtml: string;
    let contentHtml: string;

    if (viewModel.isEditing) {
      // ── Edit mode ──
      // Only render a name input when the data payload explicitly includes a
      // name field.  We check _data directly because viewModel.name defaults
      // to "" (empty string) which is truthy enough to show the row.
      const hasExplicitName = "name" in this._data;
      const nameInput = hasExplicitName
        ? `<div class="edit-row" data-prop-key="__name__">
             <label>Name</label>
             <input type="text" value="${ArsInfoTile.#escapeHtml(viewModel.name)}" class="edit-input">
           </div>`
        : "";

      const propertyInputs = viewModel.properties
        .map((p) => {
          const typeTag = viewModel.types[p.key];
          return this.#renderEditRow(p, typeTag);
        })
        .join("");

      headerHtml = `
        <div class="title-block">
          <h3 class="title">${ArsInfoTile.#escapeHtml(viewModel.title)}</h3>
        </div>
      `;

      contentHtml = `${nameInput}${propertyInputs}`;
    } else {
      // ── Display mode ──
      const nameHtml = viewModel.name
        ? `<div class="node-name">${ArsInfoTile.#escapeHtml(viewModel.name)}</div>`
        : "";
      // Hide empty properties in view mode so optional concept fields
      // (text, image, url) don't clutter the tile when unset.
      const visibleProperties = viewModel.properties.filter(
        (p) => p.value.trim() !== "",
      );
      const propertiesHtml =
        visibleProperties.length > 0
          ? visibleProperties
              .map(
                (property) => `
                <div class="property-row">
                  <span class="property-key">${ArsInfoTile.#escapeHtml(property.key)}</span>
                  <span class="property-value">${ArsInfoTile.#escapeHtml(property.value)}</span>
                </div>
              `,
              )
              .join("")
          : (viewModel.name ? "" : `<div class="empty-state">No properties</div>`);

      headerHtml = `
        <div class="title-block">
          <h3 class="title">${ArsInfoTile.#escapeHtml(viewModel.title)}</h3>
          <div class="subtitle">${ArsInfoTile.#escapeHtml(viewModel.subtitle)}</div>
        </div>
        ${
          viewModel.isCollapsible
            ? `<button
          type="button"
          class="collapse-btn"
          part="collapse-btn"
          aria-pressed="${String(viewModel.isCollapsed)}"
          aria-label="${viewModel.isCollapsed ? "Expand content" : "Collapse content"}"
          title="${viewModel.isCollapsed ? "Expand content" : "Collapse content"}"
        ><span class="caret" aria-hidden="true">▾</span></button>`
            : ""
        }
      `;

      contentHtml = `${nameHtml}${propertiesHtml}`;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
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
          user-select: none;
          -webkit-user-select: none;
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
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
        }

        .property-row {
          display: grid;
          gap: 4px;
        }

        .node-name {
          text-align: center;
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--arswc-color-text, #ecf3ff);
          line-height: 1.4;
          word-break: break-word;
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

        /* Inline editing styles */
        .edit-actions {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .edit-btn {
          all: unset;
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          font-size: 0.85rem;
          line-height: 1;
          cursor: pointer;
          border: 1px solid color-mix(in srgb, var(--arswc-color-border, #3a4d69) 64%, transparent);
          transition: background 120ms ease, color 120ms ease;
        }

        .edit-btn:hover {
          color: var(--arswc-color-text, #ecf3ff);
        }

        .save-btn {
          color: #7df5b9;
          background: color-mix(in srgb, #7df5b9 12%, transparent);
        }

        .save-btn:hover {
          background: color-mix(in srgb, #7df5b9 22%, transparent);
        }

        .cancel-btn {
          color: #ff7e88;
          background: color-mix(in srgb, #ff7e88 12%, transparent);
        }

        .cancel-btn:hover {
          background: color-mix(in srgb, #ff7e88 22%, transparent);
        }

        .edit-row {
          display: grid;
          gap: 4px;
        }

        .edit-row label {
          color: var(--arswc-color-muted, #95aac8);
          font-size: 0.72rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .edit-row input {
          width: 100%;
          box-sizing: border-box;
          min-width: 0;
          padding: 8px 10px;
          border: 1px solid var(--arswc-color-border, #3a4d69);
          user-select: text;
          -webkit-user-select: text;
          border-radius: 8px;
          background: color-mix(in srgb, var(--arswc-color-canvas, #07111d) 72%, white 2%);
          color: var(--arswc-color-text, #ecf3ff);
          font: inherit;
          font-size: 0.88rem;
        }

        .edit-row input:focus-visible {
          outline: none;
          border-color: var(--arswc-color-accent, #4cc2ff);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--arswc-color-accent, #4cc2ff) 30%, transparent);
        }
      </style>
      <article class="card" data-selected="${String(viewModel.isSelected)}" data-dragging="${String(viewModel.isDragging)}" data-collapsed="${String(viewModel.isCollapsed)}" data-collapsible="${String(viewModel.isCollapsible)}">
        <header class="header">
          ${headerHtml}
        </header>
        <section class="content">
          ${contentHtml}
        </section>
      </article>
    `;

    if (viewModel.isEditing) {
      this.#bindEditListeners();
    } else {
      this.#bindCollapseButton();
    }
  }

  // Wire Enter/Escape keys and click-outside for inline editing.
  // Uses an AbortController so repeated renders don't accumulate listeners.
  #bindEditListeners() {
    if (!this.shadowRoot) return;

    // Tear down any previous edit listeners (e.g. from a prior render).
    this._editAbortController?.abort();
    this._editAbortController = new AbortController();
    const { signal } = this._editAbortController;

    // Enter to save (when focus is inside the shadow tree).
    this.shadowRoot.addEventListener(
      "keydown",
      (e) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === "Enter") {
          e.preventDefault();
          this.#emitEditSave();
        }
      },
      { signal },
    );

    // Escape to cancel (listened on document so it works even when
    // focus has left the tile's shadow tree).
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          this.#emitEditCancel();
        }
      },
      { signal },
    );

    // Save when clicking outside the tile. Use a timeout to avoid
    // catching the same click that triggered edit mode.
    setTimeout(() => {
      if (signal.aborted) return;
      document.addEventListener(
        "click",
        (e) => {
          const path = e.composedPath();
          if (!path.includes(this)) {
            this.#emitEditSave();
          }
        },
        { signal },
      );
    }, 0);

    // Auto-focus the first input so the user can type immediately.
    this.shadowRoot.querySelector<HTMLElement>(".edit-input")?.focus();
  }

  // Collect edited values and dispatch the save event.
  #emitEditSave() {
    if (!this.shadowRoot) return;

    const properties: Record<string, string> = {};
    let name: string | undefined;

    for (const row of Array.from(this.shadowRoot.querySelectorAll(".edit-row"))) {
      const key = (row as HTMLElement).dataset["propKey"] ?? "";
      const input = row.querySelector<HTMLInputElement>(".edit-input");
      if (!input) continue;
      if (key === "__name__") {
        name = input.value.trim();
      } else if (key) {
        properties[key] = input.value.trim();
      }
    }

    this.dispatchEvent(
      new CustomEvent("ars-info-tile:edit-save", {
        bubbles: true,
        composed: true,
        detail: { name, properties },
      }),
    );
  }

  #emitEditCancel() {
    this.dispatchEvent(
      new CustomEvent("ars-info-tile:edit-cancel", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  // Republishes activation from the shadow tree so host apps can reliably react to real double-clicks.
  #bindActivationEvents() {
    if (!this.shadowRoot || this._activationEventsBound) {
      return;
    }

    this.shadowRoot.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      this.dispatchEvent(
        new CustomEvent("ars-info-tile:activate", {
          bubbles: true,
          composed: true,
          detail: {
            originalEventType: event.type,
          },
        }),
      );
    });

    // Forward right-click as a composed custom event so brainiac-engine
    // agents receive it via DOMPresentationState.forward_events.
    // Listen on the host element in the capturing phase so we intercept
    // the native event *before* it reaches any shadow-DOM children;
    // this guarantees preventDefault() wins even on browsers where
    // shadow-root bubbling behaves oddly for contextmenu.
    this.addEventListener(
      "contextmenu",
      (event: Event) => {
        // Ignore our own synthetic CustomEvent to avoid an infinite loop.
        if (event instanceof CustomEvent) {
          return;
        }
        const mouseEvent = event as MouseEvent;
        mouseEvent.preventDefault();
        mouseEvent.stopPropagation();
        this.dispatchEvent(
          new CustomEvent("contextmenu", {
            bubbles: true,
            composed: true,
            detail: {
              x: mouseEvent.clientX,
              y: mouseEvent.clientY,
            },
          }),
        );
      },
      true,
    );

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
      this.dispatchEvent(
        new CustomEvent("ars-info-tile:toggle-collapse", {
          bubbles: true,
          composed: true,
          detail: {
            collapsed: requested,
          },
        }),
      );
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

if (
  typeof customElements !== "undefined" &&
  !customElements.get("ars-info-tile")
) {
  customElements.define("ars-info-tile", ArsInfoTile);
}

// Deprecated alias — register the old tag name so existing consumers continue to work during transition.
if (
  typeof customElements !== "undefined" &&
  !customElements.get("ars-relational-node")
) {
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
