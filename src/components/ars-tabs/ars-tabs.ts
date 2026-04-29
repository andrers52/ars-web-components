// <ars-tabs> — Tabbed navigation container with companion <ars-tab-panel>.
//
// Attributes:
//   active-tab — string, the tab-id of the active tab
//   placement  — "top" | "bottom" | "start" | "end" (default "top")
//
// Slots:
//   default — accepts <ars-tab-panel> children
//
// Events:
//   ars-tabs:change — detail { activeTab, previousTab }
//
// Companion: <ars-tab-panel tab-id="..." label="..." [disabled]>
//   Slots: default (panel content), label (custom tab label)

export type ArsTabsPlacement = "top" | "bottom" | "start" | "end";

class ArsTabPanel extends HTMLElement {
  static get observedAttributes() {
    return ["tab-id", "label", "disabled"];
  }

  get tabId(): string {
    return this.getAttribute("tab-id") ?? "";
  }

  set tabId(val: string) {
    this.setAttribute("tab-id", val);
  }

  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(val: string) {
    this.setAttribute("label", val);
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(val: boolean) {
    this.toggleAttribute("disabled", val);
  }

  attributeChangedCallback() {
    // Notify parent tabs to re-render
    const parent = this.closest("ars-tabs");
    if (parent) (parent as ArsTabs).requestRender();
  }
}

class ArsTabs extends HTMLElement {
  private _activeTab = "";
  private _eventsBound = false;
  private _observer: MutationObserver | null = null;

  static get observedAttributes() {
    return ["active-tab", "placement"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    // Auto-select first tab if none specified
    if (!this._activeTab) {
      const first = this.querySelector("ars-tab-panel:not([disabled])") as ArsTabPanel | null;
      if (first) this._activeTab = first.tabId;
    }
    this.#render();
    this.#bindEvents();
    this.#observeChildren();
  }

  disconnectedCallback() {
    this._observer?.disconnect();
  }

  attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null) {
    if (name === "active-tab" && newVal !== null) {
      const previous = this._activeTab;
      this._activeTab = newVal;
      if (previous !== newVal) {
        this.dispatchEvent(
          new CustomEvent("ars-tabs:change", {
            bubbles: true,
            composed: true,
            detail: { activeTab: newVal, previousTab: previous },
          }),
        );
      }
    }
    if (this.shadowRoot) this.#render();
  }

  // --- Property accessors ---

  get activeTab(): string {
    return this._activeTab;
  }

  set activeTab(val: string) {
    this.setAttribute("active-tab", val);
  }

  get placement(): ArsTabsPlacement {
    return (this.getAttribute("placement") as ArsTabsPlacement) || "top";
  }

  set placement(val: ArsTabsPlacement) {
    this.setAttribute("placement", val);
  }

  /** Called by child panels when their attributes change. */
  requestRender() {
    if (this.shadowRoot) this.#render();
  }

  // --- Internal ---

  #getPanels(): ArsTabPanel[] {
    return Array.from(this.querySelectorAll("ars-tab-panel"));
  }

  #observeChildren() {
    this._observer = new MutationObserver(() => this.#render());
    this._observer.observe(this, { childList: true });
  }

  #render() {
    if (!this.shadowRoot) return;

    const panels = this.#getPanels();
    const placement = this.placement;
    const isVertical = placement === "start" || placement === "end";

    // Build tab buttons
    const tabsHtml = panels
      .map((panel) => {
        const isActive = panel.tabId === this._activeTab;
        const isDisabled = panel.disabled;
        return `<button
          class="tab ${isActive ? "tab--active" : ""}"
          role="tab"
          aria-selected="${String(isActive)}"
          aria-controls="panel-${ArsTabs.#escapeAttr(panel.tabId)}"
          data-tab-id="${ArsTabs.#escapeAttr(panel.tabId)}"
          ${isDisabled ? "disabled" : ""}
          tabindex="${isActive ? "0" : "-1"}"
        >${ArsTabs.#escapeHtml(panel.label)}</button>`;
      })
      .join("");

    // Show/hide panels using display
    panels.forEach((panel) => {
      panel.style.display = panel.tabId === this._activeTab ? "block" : "none";
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("id", `panel-${panel.tabId}`);
      if (panel.tabId === this._activeTab) {
        panel.removeAttribute("hidden");
      } else {
        panel.setAttribute("hidden", "");
      }
    });

    this.shadowRoot.innerHTML = `
      <style>${ArsTabs.#styles(isVertical)}</style>
      <div class="tabs-container tabs-container--${placement}">
        <div class="tablist" role="tablist" aria-orientation="${isVertical ? "vertical" : "horizontal"}">
          ${tabsHtml}
        </div>
        <div class="panels">
          <slot></slot>
        </div>
      </div>
    `;
  }

  #bindEvents() {
    if (!this.shadowRoot || this._eventsBound) return;
    this._eventsBound = true;

    // Tab click
    this.shadowRoot.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest("[data-tab-id]") as HTMLElement | null;
      if (!target || target.hasAttribute("disabled")) return;
      const tabId = target.dataset.tabId ?? "";
      if (tabId) this.activeTab = tabId;
    });

    // Keyboard navigation
    this.shadowRoot.addEventListener("keydown", (evt) => {
      const e = evt as KeyboardEvent;
      const target = e.target as HTMLElement;
      if (!target.classList.contains("tab")) return;

      const tabs = Array.from(this.shadowRoot!.querySelectorAll(".tab:not(:disabled)")) as HTMLElement[];
      const idx = tabs.indexOf(target);
      if (idx < 0) return;

      let newIdx = idx;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          newIdx = (idx + 1) % tabs.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          newIdx = (idx - 1 + tabs.length) % tabs.length;
          break;
        case "Home":
          e.preventDefault();
          newIdx = 0;
          break;
        case "End":
          e.preventDefault();
          newIdx = tabs.length - 1;
          break;
        default:
          return;
      }

      tabs[newIdx].focus();
      const tabId = tabs[newIdx].dataset.tabId ?? "";
      if (tabId) this.activeTab = tabId;
    });
  }

  static #escapeHtml(value: string): string {
    return (value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  static #escapeAttr(value: string): string {
    return (value ?? "").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }

  static #styles(isVertical: boolean): string {
    return `
      :host {
        display: block;
        font-family: var(--arswc-font-family-sans, system-ui, sans-serif);
      }

      .tabs-container {
        display: flex;
        ${isVertical ? "" : "flex-direction: column;"}
      }

      .tabs-container--bottom {
        flex-direction: column-reverse;
      }

      .tabs-container--end {
        flex-direction: row-reverse;
      }

      .tablist {
        display: flex;
        ${isVertical ? "flex-direction: column;" : ""}
        gap: 0;
        border-${isVertical ? "right" : "bottom"}: 2px solid var(--arswc-color-border, #d5dde8);
        ${isVertical ? `min-width: 120px;` : ""}
      }

      .tabs-container--bottom .tablist {
        border-bottom: none;
        border-top: 2px solid var(--arswc-color-border, #d5dde8);
      }

      .tabs-container--end .tablist {
        border-right: none;
        border-left: 2px solid var(--arswc-color-border, #d5dde8);
      }

      .tab {
        padding: var(--arswc-spacing-sm, 8px) var(--arswc-spacing-md, 16px);
        border: none;
        background: transparent;
        color: var(--arswc-color-muted, #64748b);
        font-family: inherit;
        font-size: var(--arswc-font-size-md, 0.875rem);
        font-weight: 500;
        cursor: pointer;
        position: relative;
        transition: color var(--arswc-transition-duration, 200ms) ease;
        white-space: nowrap;
      }

      .tab:hover:not(:disabled) {
        color: var(--arswc-color-text, #1b2430);
      }

      .tab--active {
        color: var(--arswc-color-accent, #2563eb);
        font-weight: 600;
      }

      .tab--active::after {
        content: '';
        position: absolute;
        ${isVertical
          ? `top: 0; right: -2px; width: 2px; height: 100%;`
          : `bottom: -2px; left: 0; height: 2px; width: 100%;`
        }
        background: var(--arswc-color-accent, #2563eb);
        transition: all var(--arswc-transition-duration, 200ms) ease;
      }

      .tabs-container--bottom .tab--active::after {
        bottom: auto;
        top: -2px;
      }

      .tabs-container--end .tab--active::after {
        right: auto;
        left: -2px;
      }

      .tab:disabled {
        color: var(--arswc-color-disabled, #9ca3af);
        cursor: not-allowed;
      }

      .tab:focus-visible {
        outline: none;
        box-shadow: var(--arswc-focus-ring, 0 0 0 3px rgba(37, 99, 235, 0.3));
        border-radius: 2px;
      }

      .panels {
        flex: 1;
        min-width: 0;
        padding: var(--arswc-spacing-md, 16px);
      }
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("ars-tab-panel")) {
  customElements.define("ars-tab-panel", ArsTabPanel);
}

if (typeof customElements !== "undefined" && !customElements.get("ars-tabs")) {
  customElements.define("ars-tabs", ArsTabs);
}

export { ArsTabs, ArsTabPanel, ArsTabs as default };
