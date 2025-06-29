// ARS Page Controller Component
// Provides navigation controls for the ars-page router
//
// usage:
//  <ars-page-controller
//    target-page="my-page-router"
//    navigation-type="buttons|tabs|dropdown">
//  </ars-page-controller>
//
// Attributes:
// - target-page: ID of the ars-page component to control
// - navigation-type: Type of navigation UI (buttons, tabs, dropdown)
// - show-current: Whether to highlight the current page (true/false)

import { RemoteCallCallerMixin } from "../mixins/remote-call/remote-call-caller.js";

class ArsPageController extends RemoteCallCallerMixin(HTMLElement) {
  constructor() {
    super();
    this._targetPage = null;
    this._navigationType = "buttons";
    this._showCurrent = true;
    this._currentPage = null;
    this._availablePages = [];
    this._navigationElement = null;
  }

  static get observedAttributes() {
    return ["target-page", "navigation-type", "show-current"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "target-page" && newValue) {
      this._targetPage = newValue;
      this._updateNavigation();
    } else if (name === "navigation-type" && newValue) {
      this._navigationType = newValue;
      this._updateNavigation();
    } else if (name === "show-current") {
      this._showCurrent = newValue === "true";
      this._updateNavigation();
    }
  }

  connectedCallback() {
    super.connectedCallback && super.connectedCallback();
    this._initializeController();
    setTimeout(() => this._refreshPageInfo(), 100); // Force a refresh after initial setup
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._navigationElement) {
      this._navigationElement.remove();
      this._navigationElement = null;
    }
  }

  // Private methods
  _initializeController() {
    // Get attributes
    this._targetPage = this.getAttribute("target-page") || this._targetPage;
    this._navigationType =
      this.getAttribute("navigation-type") || this._navigationType;
    this._showCurrent = this.getAttribute("show-current") !== "false";

    // Create navigation UI
    this._createNavigationUI();

    // Get initial page info
    this._refreshPageInfo();
  }

  _createNavigationUI() {
    console.log(
      "[ars-page-controller] _createNavigationUI: called, _availablePages",
      this._availablePages,
      new Error().stack,
    );
    // Remove existing navigation
    if (this._navigationElement && this.contains(this._navigationElement)) {
      this.removeChild(this._navigationElement);
    }
    this._navigationElement = null;

    // Defensive: Only create if we have pages
    console.log(
      "[ars-page-controller] _createNavigationUI: _availablePages",
      this._availablePages,
    );
    if (!this._availablePages || this._availablePages.length === 0) {
      console.warn(
        "[ars-page-controller] _createNavigationUI: No pages to create navigation for",
      );
      return;
    }

    // Create new navigation based on type
    switch (this._navigationType) {
      case "tabs":
        this._navigationElement = this._createTabsNavigation();
        break;
      case "dropdown":
        this._navigationElement = this._createDropdownNavigation();
        break;
      case "buttons":
      default:
        this._navigationElement = this._createButtonsNavigation();
        break;
    }

    // Add to DOM
    if (this._navigationElement) {
      this._navigationElement.style.border = "2px solid red"; // Visual marker
      this.appendChild(this._navigationElement);
      console.log(
        "[ars-page-controller] _createNavigationUI: navigation element added to DOM",
        this._navigationElement,
        "with pages",
        this._availablePages,
      );
      this._updateNavigation();
    }
  }

  _createButtonsNavigation() {
    const container = document.createElement("div");
    container.className = "ars-page-nav-buttons";
    container.style.cssText = `
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin: 10px 0;
      justify-content: center;
    `;

    // Buttons will be added by _updateNavigationButtons
    return container;
  }

  _createTabsNavigation() {
    const container = document.createElement("div");
    container.className = "ars-page-nav-tabs";
    container.style.cssText = `
      display: flex;
      border-bottom: 2px solid #e0e0e0;
      margin: 10px 0;
    `;

    // Tabs will be added by _updateNavigationButtons
    return container;
  }

  _createDropdownNavigation() {
    const container = document.createElement("div");
    container.className = "ars-page-nav-dropdown";
    container.style.cssText = `
      margin: 10px 0;
    `;

    const select = document.createElement("select");
    select.style.cssText = `
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      background: white;
      cursor: pointer;
    `;

    select.addEventListener("change", (e) => {
      const pageId = e.target.value;
      if (pageId) {
        this.navigateToPage(pageId);
      }
    });

    container.appendChild(select);
    return container;
  }

  _updateNavigation() {
    console.log(
      "[ars-page-controller] _updateNavigation: called, _availablePages",
      this._availablePages,
    );
    if (!this._navigationElement) return;
    switch (this._navigationType) {
      case "tabs":
        this._updateTabsNavigation();
        break;
      case "dropdown":
        this._updateDropdownNavigation();
        break;
      case "buttons":
      default:
        this._updateButtonsNavigation();
        break;
    }
  }

  _updateButtonsNavigation() {
    console.log(
      "[ars-page-controller] _updateButtonsNavigation: called, _availablePages",
      this._availablePages,
    );
    if (!this._navigationElement || this._navigationType !== "buttons") return;
    if (!this._availablePages || this._availablePages.length === 0) return;

    this._navigationElement.innerHTML = "";

    this._availablePages.forEach((pageId) => {
      console.log("[ars-page-controller] Creating nav button for", pageId);
      const button = document.createElement("button");
      button.textContent = this._formatPageName(pageId);
      button.className = "ars-page-nav-btn";
      button.style.cssText = `
        padding: 8px 16px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
      `;

      // Highlight current page
      if (this._showCurrent && pageId === this._currentPage) {
        button.style.background = "#667eea";
        button.style.color = "white";
        button.style.borderColor = "#667eea";
      }

      button.addEventListener("click", () => {
        this.navigateToPage(pageId);
      });

      this._navigationElement.appendChild(button);
    });
  }

  _updateTabsNavigation() {
    if (!this._navigationElement || this._navigationType !== "tabs") return;
    if (!this._availablePages || this._availablePages.length === 0) return;

    this._navigationElement.innerHTML = "";

    this._availablePages.forEach((pageId) => {
      const tab = document.createElement("div");
      tab.textContent = this._formatPageName(pageId);
      tab.className = "ars-page-nav-tab";
      tab.style.cssText = `
        padding: 12px 20px;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.2s ease;
        font-size: 14px;
        font-weight: 500;
      `;

      // Highlight current page
      if (this._showCurrent && pageId === this._currentPage) {
        tab.style.borderBottomColor = "#667eea";
        tab.style.color = "#667eea";
      }

      tab.addEventListener("click", () => {
        this.navigateToPage(pageId);
      });

      this._navigationElement.appendChild(tab);
    });
  }

  _updateDropdownNavigation() {
    if (!this._navigationElement || this._navigationType !== "dropdown") return;
    if (!this._availablePages || this._availablePages.length === 0) return;

    const select = this._navigationElement.querySelector("select");
    if (!select) return;

    select.innerHTML = "";

    this._availablePages.forEach((pageId) => {
      const option = document.createElement("option");
      option.value = pageId;
      option.textContent = this._formatPageName(pageId);

      if (this._showCurrent && pageId === this._currentPage) {
        option.selected = true;
      }

      select.appendChild(option);
    });
  }

  _formatPageName(pageId) {
    // Convert page ID to display name (e.g., "home-page" -> "Home Page")
    return pageId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Helper to compare arrays
  _arraysEqual(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  async _refreshPageInfo() {
    console.log(
      "[ars-page-controller] _refreshPageInfo: START, _availablePages",
      this._availablePages,
    );
    if (!this._targetPage) return;
    console.log(
      "[ars-page-controller] _refreshPageInfo: requesting getPageInfo from",
      this._targetPage,
    );
    try {
      const result = await this.makeRemoteCall(
        { method: "getPageInfo" },
        5000,
        this._targetPage,
      );
      console.log("[ars-page-controller] _refreshPageInfo: RAW result", result);
      console.log("[ars-page-controller] _refreshPageInfo: got result", result);
      if (result && result.availablePages) {
        const newPages = result.availablePages || [];
        this._currentPage = result.currentPage;
        this._availablePages = newPages;
        console.log(
          "[ars-page-controller] _refreshPageInfo: SET _availablePages",
          this._availablePages,
        );
        this._createNavigationUI();
        this._updateNavigation();
      } else {
        console.warn(
          "[ars-page-controller] _refreshPageInfo: no data in result",
          result,
        );
      }
    } catch (error) {
      console.error("ARS Page Controller: Failed to get page info:", error);
    }
  }

  // Public methods
  async navigateToPage(pageId) {
    if (!this._targetPage) {
      console.error("ARS Page Controller: No target page specified");
      return false;
    }

    try {
      const result = await this.makeRemoteCall(
        {
          method: "showPage",
          args: [pageId],
        },
        5000,
        this._targetPage,
      );

      if (result && result.success) {
        this._currentPage = pageId;
        await this._refreshPageInfo();
        // Dispatch navigation event
        this.dispatchEvent(
          new CustomEvent("ars-page-controller:navigated", {
            detail: {
              pageId,
              previousPage: this._currentPage,
              success: true,
            },
            bubbles: true,
            composed: true,
          }),
        );
        return true;
      }
    } catch (error) {
      console.error(
        `ARS Page Controller: Failed to navigate to page '${pageId}':`,
        error,
      );
    }

    return false;
  }

  async hidePage(pageId) {
    if (!this._targetPage) return false;

    try {
      const result = await this.makeRemoteCall(
        {
          method: "hidePage",
          args: [pageId],
        },
        5000,
        this._targetPage,
      );
      if (result && result.success) {
        await this._refreshPageInfo();
      }
      return result && result.success;
    } catch (error) {
      console.error(
        `ARS Page Controller: Failed to hide page '${pageId}':`,
        error,
      );
      return false;
    }
  }

  async showAllPages() {
    if (!this._targetPage) return false;

    try {
      const result = await this.makeRemoteCall(
        { method: "showAllPages" },
        5000,
        this._targetPage,
      );
      if (result && result.success) {
        await this._refreshPageInfo();
      }
      return result && result.success;
    } catch (error) {
      console.error("ARS Page Controller: Failed to show all pages:", error);
      return false;
    }
  }

  async hideAllPages() {
    if (!this._targetPage) return false;

    try {
      const result = await this.makeRemoteCall(
        { method: "hideAllPages" },
        5000,
        this._targetPage,
      );
      if (result && result.success) {
        await this._refreshPageInfo();
      }
      return result && result.success;
    } catch (error) {
      console.error("ARS Page Controller: Failed to hide all pages:", error);
      return false;
    }
  }

  async getCurrentPage() {
    if (!this._targetPage) return null;

    try {
      const result = await this.makeRemoteCall(
        { method: "getPageInfo" },
        5000,
        this._targetPage,
      );
      // Return the full result object (with currentPage, availablePages, etc.)
      return result || null;
    } catch (error) {
      console.error("ARS Page Controller: Failed to get current page:", error);
      return null;
    }
  }
}

// Register the custom element
customElements.define("ars-page-controller", ArsPageController);

export { ArsPageController, ArsPageController as default };
