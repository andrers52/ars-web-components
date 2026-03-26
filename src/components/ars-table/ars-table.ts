// <ars-table> — Data table with sortable columns, row selection, and virtual scrolling.
//
// Attributes:
//   selectable     — "none" | "single" | "multiple" (default "none")
//   sortable       — boolean, enables column sorting
//   striped        — boolean, alternating row background
//   compact        — boolean, reduced padding
//   virtual-scroll — boolean, windowed rendering for large datasets
//   auto-sort      — boolean, sort data in-component (default: emit-only)
//
// Properties:
//   columns      — { key, label, sortable?, width?, align?, render? }[]
//   data         — row objects[]
//   selectedRows — read-only, selected row indices
//
// Events:
//   ars-table:sort      — detail { column, direction }
//   ars-table:select    — detail { selectedRows, row, action }
//   ars-table:row-click — detail { row, index }
//
// Slots:
//   empty — shown when data is empty

export interface ArsTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: "start" | "center" | "end";
  render?: (value: unknown, row: Record<string, unknown>) => string;
}

export type ArsTableSelectable = "none" | "single" | "multiple";

class ArsTable extends HTMLElement {
  private _columns: ArsTableColumn[] = [];
  private _data: Record<string, unknown>[] = [];
  private _selectedRows: Set<number> = new Set();
  private _sortColumn = "";
  private _sortDirection: "asc" | "desc" = "asc";
  private _eventsBound = false;
  private _scrollStart = 0;
  private _visibleCount = 50;

  static get observedAttributes() {
    return ["selectable", "sortable", "striped", "compact", "virtual-scroll", "auto-sort"];
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
    if (this.shadowRoot) this.#render();
  }

  // --- Property accessors ---

  get columns(): ArsTableColumn[] {
    return [...this._columns];
  }

  set columns(val: ArsTableColumn[]) {
    this._columns = [...val];
    this.#render();
  }

  get data(): Record<string, unknown>[] {
    return [...this._data];
  }

  set data(val: Record<string, unknown>[]) {
    this._data = [...val];
    this._selectedRows.clear();
    this._scrollStart = 0;
    this.#render();
  }

  get selectedRows(): number[] {
    return [...this._selectedRows];
  }

  get selectable(): ArsTableSelectable {
    return (this.getAttribute("selectable") as ArsTableSelectable) || "none";
  }

  set selectable(val: ArsTableSelectable) {
    this.setAttribute("selectable", val);
  }

  get sortable(): boolean {
    return this.hasAttribute("sortable");
  }

  get striped(): boolean {
    return this.hasAttribute("striped");
  }

  get compact(): boolean {
    return this.hasAttribute("compact");
  }

  get virtualScroll(): boolean {
    return this.hasAttribute("virtual-scroll");
  }

  get autoSort(): boolean {
    return this.hasAttribute("auto-sort");
  }

  // --- Sorting ---

  #getSortedData(): Record<string, unknown>[] {
    if (!this._sortColumn || !this.autoSort) return this._data;
    const col = this._sortColumn;
    const dir = this._sortDirection === "asc" ? 1 : -1;
    return [...this._data].sort((a, b) => {
      const va = String(a[col] ?? "");
      const vb = String(b[col] ?? "");
      return va.localeCompare(vb, undefined, { numeric: true }) * dir;
    });
  }

  #sort(columnKey: string) {
    if (this._sortColumn === columnKey) {
      this._sortDirection = this._sortDirection === "asc" ? "desc" : "asc";
    } else {
      this._sortColumn = columnKey;
      this._sortDirection = "asc";
    }
    this.dispatchEvent(
      new CustomEvent("ars-table:sort", {
        bubbles: true,
        composed: true,
        detail: { column: columnKey, direction: this._sortDirection },
      }),
    );
    this.#render();
  }

  // --- Selection ---

  #toggleSelection(idx: number) {
    const mode = this.selectable;
    if (mode === "none") return;

    let action: string;
    if (mode === "single") {
      if (this._selectedRows.has(idx)) {
        this._selectedRows.clear();
        action = "deselect";
      } else {
        this._selectedRows.clear();
        this._selectedRows.add(idx);
        action = "select";
      }
    } else {
      if (this._selectedRows.has(idx)) {
        this._selectedRows.delete(idx);
        action = "deselect";
      } else {
        this._selectedRows.add(idx);
        action = "select";
      }
    }

    this.dispatchEvent(
      new CustomEvent("ars-table:select", {
        bubbles: true,
        composed: true,
        detail: {
          selectedRows: this.selectedRows,
          row: this._data[idx],
          action,
        },
      }),
    );
    this.#render();
  }

  // --- Rendering ---

  #render() {
    if (!this.shadowRoot) return;

    const sortedData = this.#getSortedData();
    const isEmpty = sortedData.length === 0;
    const isVirtual = this.virtualScroll && sortedData.length > this._visibleCount;
    const visibleData = isVirtual
      ? sortedData.slice(this._scrollStart, this._scrollStart + this._visibleCount)
      : sortedData;
    const isCompact = this.compact;
    const isStriped = this.striped;
    const selectMode = this.selectable;
    const isSortable = this.sortable;

    if (isEmpty) {
      this.shadowRoot.innerHTML = `
        <style>${ArsTable.#styles(isCompact)}</style>
        <div class="empty"><slot name="empty">No data</slot></div>
      `;
      return;
    }

    const headerCells = this._columns
      .map((col) => {
        const canSort = isSortable && (col.sortable !== false);
        const isSorted = this._sortColumn === col.key;
        const arrow = isSorted ? (this._sortDirection === "asc" ? " &#9650;" : " &#9660;") : "";
        return `<th
          class="th ${canSort ? "th--sortable" : ""}"
          role="columnheader"
          ${isSorted ? `aria-sort="${this._sortDirection === "asc" ? "ascending" : "descending"}"` : ""}
          data-col="${ArsTable.#escapeAttr(col.key)}"
          style="${col.width ? `width: ${col.width};` : ""} ${col.align ? `text-align: ${col.align};` : ""}"
        >${ArsTable.#escapeHtml(col.label)}${arrow}</th>`;
      })
      .join("");

    const rows = visibleData
      .map((row, visIdx) => {
        const dataIdx = isVirtual ? this._scrollStart + visIdx : visIdx;
        const isSelected = this._selectedRows.has(dataIdx);
        const cells = this._columns
          .map((col) => {
            const raw = row[col.key];
            const rendered = col.render ? col.render(raw, row) : ArsTable.#escapeHtml(String(raw ?? ""));
            return `<td class="td" role="gridcell" style="${col.align ? `text-align: ${col.align};` : ""}">${rendered}</td>`;
          })
          .join("");
        return `<tr class="row ${isSelected ? "row--selected" : ""} ${isStriped && dataIdx % 2 === 1 ? "row--striped" : ""}"
                    role="row"
                    data-row-idx="${dataIdx}">${selectMode !== "none" ? `<td class="td td--select"><input type="checkbox" ${isSelected ? "checked" : ""} aria-label="Select row"></td>` : ""}${cells}</tr>`;
      })
      .join("");

    this.shadowRoot.innerHTML = `
      <style>${ArsTable.#styles(isCompact)}</style>
      <div class="table-wrapper">
        ${isVirtual ? `<div class="virtual-info">${sortedData.length} rows (showing ${this._scrollStart + 1}-${Math.min(this._scrollStart + this._visibleCount, sortedData.length)})</div>` : ""}
        <table class="table" role="grid">
          <thead>
            <tr role="row">${selectMode !== "none" ? '<th class="th th--select" role="columnheader"></th>' : ""}${headerCells}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        ${isVirtual ? `
        <div class="virtual-controls">
          <button class="nav-btn" data-scroll="prev" ${this._scrollStart <= 0 ? "disabled" : ""}>&#9650; Previous</button>
          <button class="nav-btn" data-scroll="next" ${this._scrollStart + this._visibleCount >= sortedData.length ? "disabled" : ""}>&#9660; Next</button>
        </div>
        ` : ""}
      </div>
    `;
  }

  #bindEvents() {
    if (!this.shadowRoot || this._eventsBound) return;
    this._eventsBound = true;

    this.shadowRoot.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;

      // Sort header click
      const th = target.closest(".th--sortable") as HTMLElement | null;
      if (th) {
        const col = th.dataset.col ?? "";
        if (col) this.#sort(col);
        return;
      }

      // Row click
      const row = target.closest("[data-row-idx]") as HTMLElement | null;
      if (row) {
        const idx = parseInt(row.dataset.rowIdx ?? "0", 10);

        // Checkbox or selection
        if (target.tagName === "INPUT" || target.closest(".td--select")) {
          this.#toggleSelection(idx);
          return;
        }

        this.dispatchEvent(
          new CustomEvent("ars-table:row-click", {
            bubbles: true,
            composed: true,
            detail: { row: this._data[idx], index: idx },
          }),
        );

        // If selectable, also toggle on row click
        if (this.selectable !== "none") {
          this.#toggleSelection(idx);
        }
      }

      // Virtual scroll buttons
      const scrollBtn = target.closest("[data-scroll]") as HTMLElement | null;
      if (scrollBtn) {
        const dir = scrollBtn.dataset.scroll;
        const total = this.#getSortedData().length;
        if (dir === "next") {
          this._scrollStart = Math.min(this._scrollStart + this._visibleCount, total - this._visibleCount);
        } else {
          this._scrollStart = Math.max(0, this._scrollStart - this._visibleCount);
        }
        this.#render();
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

  static #styles(isCompact: boolean): string {
    const pad = isCompact ? "4px 8px" : "8px 12px";
    return `
      :host {
        display: block;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
      }

      .table-wrapper {
        overflow-x: auto;
      }

      .table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--arswc-font-size-md, 0.875rem);
      }

      .th {
        padding: ${pad};
        text-align: start;
        font-size: var(--arswc-font-size-sm, 0.75rem);
        font-weight: 600;
        color: var(--arswc-color-muted, #64748b);
        border-bottom: 2px solid var(--arswc-color-border, #d5dde8);
        white-space: nowrap;
        user-select: none;
      }

      .th--sortable {
        cursor: pointer;
      }

      .th--sortable:hover {
        color: var(--arswc-color-text, #1b2430);
      }

      .th--select {
        width: 40px;
      }

      .td {
        padding: ${pad};
        border-bottom: 1px solid var(--arswc-color-border, #d5dde8);
        color: var(--arswc-color-text, #1b2430);
      }

      .td--select {
        width: 40px;
        text-align: center;
      }

      .row {
        transition: background var(--arswc-transition-duration, 200ms) ease;
      }

      .row:hover {
        background: color-mix(in srgb, var(--arswc-color-accent, #2563eb) 5%, transparent);
      }

      .row--selected {
        background: color-mix(in srgb, var(--arswc-color-accent, #2563eb) 10%, transparent);
      }

      .row--striped {
        background: color-mix(in srgb, var(--arswc-color-surface, #f6f8fb) 80%, var(--arswc-color-border, #d5dde8) 20%);
      }

      .row--striped:hover {
        background: color-mix(in srgb, var(--arswc-color-accent, #2563eb) 8%, transparent);
      }

      .empty {
        padding: var(--arswc-spacing-xl, 32px);
        text-align: center;
        color: var(--arswc-color-muted, #64748b);
        font-size: var(--arswc-font-size-md, 0.875rem);
      }

      .virtual-info {
        padding: var(--arswc-spacing-xs, 4px) var(--arswc-spacing-sm, 8px);
        font-size: var(--arswc-font-size-sm, 0.75rem);
        color: var(--arswc-color-muted, #64748b);
      }

      .virtual-controls {
        display: flex;
        gap: var(--arswc-spacing-sm, 8px);
        padding: var(--arswc-spacing-sm, 8px);
        justify-content: center;
      }

      .nav-btn {
        padding: var(--arswc-spacing-xs, 4px) var(--arswc-spacing-md, 16px);
        border: 1px solid var(--arswc-color-border, #d5dde8);
        border-radius: var(--arswc-radius-sm, 6px);
        background: var(--arswc-color-surface, #f6f8fb);
        color: var(--arswc-color-text, #1b2430);
        cursor: pointer;
        font-size: var(--arswc-font-size-sm, 0.75rem);
      }

      .nav-btn:disabled {
        opacity: 0.4;
        cursor: default;
      }

      .nav-btn:hover:not(:disabled) {
        background: var(--arswc-color-border, #d5dde8);
      }

      input[type="checkbox"] {
        cursor: pointer;
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-table")) {
  customElements.define("ars-table", ArsTable);
}

export { ArsTable, ArsTable as default };
