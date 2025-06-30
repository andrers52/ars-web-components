// ARS Page Controller Component
// Provides navigation controls for the ars-page router by wrapping custom navigation HTML.
//
// usage:
//  <ars-page-controller target-page="my-page-router">
//    <nav>
//      <a data-page="dashboard">Dashboard</a>
//      <a data-page="bots">Bots</a>
//      ...
//    </nav>
//  </ars-page-controller>
//
// Convention:
// - Any child element with a data-page attribute will be used for navigation.
// - Clicking such an element will trigger navigation to the corresponding pageId.
// - The controller will update the "active" class on the clicked element.
//
// Attributes:
// - target-page: ID of the ars-page component to control
//
// The controller no longer generates its own UI (tabs, buttons, dropdown).

import { RemoteCallCallerMixin } from "../mixins/remote-call/remote-call-caller.js";

class ArsPageController extends RemoteCallCallerMixin(HTMLElement) {
  constructor() {
    super();
    this._targetPage = null;
    this._currentPage = null;
    this._availablePages = [];
    this._navClickHandler = this._onNavClick.bind(this);
  }

  static get observedAttributes() {
    return ["target-page"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "target-page" && newValue) {
      this._targetPage = newValue;
      this._refreshPageInfo();
    }
  }

  connectedCallback() {
    super.connectedCallback && super.connectedCallback();
    this._targetPage = this.getAttribute("target-page") || this._targetPage;
    this._setupNavListeners();
    setTimeout(() => this._refreshPageInfo(), 100);
  }

  disconnectedCallback() {
    super.disconnectedCallback && super.disconnectedCallback();
    this._removeNavListeners();
  }

  _setupNavListeners() {
    this._removeNavListeners();
    // Listen for clicks on any child with data-page
    this._navLinks = Array.from(this.querySelectorAll('[data-page]'));
    this._navLinks.forEach(link => {
      link.addEventListener('click', this._navClickHandler);
    });
  }

  _removeNavListeners() {
    if (this._navLinks) {
      this._navLinks.forEach(link => {
        link.removeEventListener('click', this._navClickHandler);
      });
    }
    this._navLinks = [];
  }

  _onNavClick(e) {
    e.preventDefault();
    const link = e.currentTarget;
    const pageId = link.getAttribute('data-page');
    if (pageId) {
      this.navigateToPage(pageId);
      // Update active class
      this._navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  }

  _refreshPageInfo() {
    if (!this._targetPage) return;

    // Use the simplified _callRemote method
    this._callRemote(this._targetPage, 'getPageInfo');

    // Since we can't get a return value directly, we'll listen for the page change event
    // to update our state
    this._updateActiveState();
  }

  _updateActiveState() {
    // Update active class based on current page
    this._navLinks?.forEach(link => {
      const pageId = link.getAttribute('data-page');
      // We'll get the current page from the target component
      const targetComponent = document.getElementById(this._targetPage);
      if (targetComponent && targetComponent._currentPage === pageId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Public methods
  navigateToPage(pageId) {
    if (!this._targetPage) {
      console.error("ARS Page Controller: No target page specified");
      return false;
    }

    // Use the simplified _callRemote method
    this._callRemote(this._targetPage, 'showPage', pageId);

    // Update active state after a short delay to allow the page to change
    setTimeout(() => {
      this._updateActiveState();
    }, 50);

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

  getCurrentPage() {
    if (!this._targetPage) return null;

    const targetComponent = document.getElementById(this._targetPage);
    if (targetComponent) {
      return targetComponent._currentPage;
    }
    return null;
  }
}

// Register the custom element
customElements.define("ars-page-controller", ArsPageController);

export { ArsPageController, ArsPageController as default };
