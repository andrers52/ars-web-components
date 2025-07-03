// ARS Page Router Component
// Provides routing functionality for web applications
//
// usage:
//  <ars-page id="my-page-router">
//    <div id="home">Home page content</div>
//    <div id="about">About page content</div>
//    <div id="contact">Contact page content</div>
//  </ars-page>
//
// Remote call methods:
// - showPage(pageId): Shows the page with the specified ID
// - hidePage(pageId): Hides the page with the specified ID
// - showAllPages(): Shows all pages
// - hideAllPages(): Hides all pages
// - getCurrentPage(): Returns the ID of the currently visible page
// - getPageInfo(): Returns information about the current page and available pages

class ArsPage extends HTMLElement {
  constructor() {
    super();
    this._currentPage = null;
    this._pages = new Map();
    this._defaultPage = null;
  }

  static get observedAttributes() {
    return ["default-page"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "default-page" && newValue) {
      this._defaultPage = newValue;
    }
  }

  connectedCallback() {
    console.log("[ars-page] connectedCallback");
    this._initializePages();

    // Show default page if specified
    if (this._defaultPage) {
      console.log(
        "[ars-page] connectedCallback: showPage(defaultPage)",
        this._defaultPage,
      );
      this.showPage(this._defaultPage);
    } else if (this._pages.size > 0) {
      const firstPageId = this._pages.keys().next().value;
      console.log(
        "[ars-page] connectedCallback: showPage(firstPage)",
        firstPageId,
      );
      this.showPage(firstPageId);
    }
  }

  disconnectedCallback() {
    this._pages.clear();
  }

  // Private methods
  _initializePages() {
    this._pages.clear();
    const pageElements = Array.from(this.children).filter((child) => child.id);
    pageElements.forEach((element) => {
      this._pages.set(element.id, element);
      element.style.display = "none";
    });
    console.log(
      "[ars-page] _initializePages: found pages",
      Array.from(this._pages.keys()),
    );
  }

  _showPage(pageId) {
    console.log(
      "[ars-page] _showPage called with",
      pageId,
      "available:",
      Array.from(this._pages.keys()),
    );
    if (!this._pages.has(pageId)) {
      console.error(`ARS Page: Page with ID '${pageId}' not found`);
      return false;
    }
    if (this._currentPage && this._pages.has(this._currentPage)) {
      this._pages.get(this._currentPage).style.display = "none";
    }
    const pageElement = this._pages.get(pageId);
    pageElement.style.display = "block";
    this._currentPage = pageId;
    this.dispatchEvent(
      new CustomEvent("ars-page:page-changed", {
        detail: {
          previousPage: this._currentPage,
          currentPage: pageId,
          pageElement: pageElement,
        },
        bubbles: true,
        composed: true,
      }),
    );
    console.log(`[ars-page] Switched to page '${pageId}'`);
    return true;
  }

  _hidePage(pageId) {
    console.log("[ars-page] _hidePage called with", pageId);
    if (!this._pages.has(pageId)) {
      console.error(`ARS Page: Page with ID '${pageId}' not found`);
      return false;
    }
    const pageElement = this._pages.get(pageId);
    pageElement.style.display = "none";
    if (this._currentPage === pageId) {
      this._currentPage = null;
    }
    console.log(`[ars-page] Hidden page '${pageId}'`);
    return true;
  }

  // Public methods (called by ars-page-controller via _callRemote)
  showPage(pageId) {
    const success = this._showPage(pageId);
    return { success, pageId, currentPage: this._currentPage };
  }

  hidePage(pageId) {
    const success = this._hidePage(pageId);
    return { success, pageId, currentPage: this._currentPage };
  }

  showAllPages() {
    this._pages.forEach((element, pageId) => {
      element.style.display = "block";
    });
    console.log(`ARS Page: Showed all ${this._pages.size} pages`);
    return { success: true, pagesShown: this._pages.size };
  }

  hideAllPages() {
    this._pages.forEach((element, pageId) => {
      element.style.display = "none";
    });
    this._currentPage = null;
    console.log(`ARS Page: Hidden all ${this._pages.size} pages`);
    return { success: true, pagesHidden: this._pages.size };
  }

  getCurrentPage() {
    return {
      currentPage: this._currentPage,
      availablePages: Array.from(this._pages.keys()),
    };
  }

  getPageInfo() {
    return {
      currentPage: this._currentPage,
      availablePages: Array.from(this._pages.keys()),
      totalPages: this._pages.size,
      defaultPage: this._defaultPage,
    };
  }
}

// Register the custom element
customElements.define("ars-page", ArsPage);

export { ArsPage, ArsPage as default };
