// ARS Page Controller Internal Component
// Provides navigation controls for the ars-page router by wrapping custom navigation HTML.
//
// usage:
//  <ars-page-controller-internal target-page="my-page-router">
//    <nav>
//      <a data-page="dashboard">Dashboard</a>
//      <a data-page="bots">Bots</a>
//      <a data-route="/settings/trading-pairs">Trading Pairs</a>
//      ...
//    </nav>
//  </ars-page-controller-internal>
//
// Convention:
// - Any child element with a data-page attribute will be used for navigation.
// - Any child element with a data-route attribute will be used for route-based navigation.
// - Clicking such an element will trigger navigation to the corresponding pageId or route.
// - The controller will update the "active" class on the clicked element.
//
// Attributes:
// - target-page: ID of the ars-page component to control
//
// The controller no longer generates its own UI (tabs, buttons, dropdown).

import WebComponentBase from "../web-component-base/web-component-base.js";

class ArsPageControllerInternal extends WebComponentBase {
  [key: string]: any;

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
    this._targetPage = this.getAttribute("target-page") || this._targetPage;

    // Wait a bit for the router to be fully initialized
    setTimeout(() => {
      this._setupNavListeners();
      this._refreshPageInfo();
    }, 200);

    this._popStateHandler = () => {
      /* URL was restored by browser back/forward */
      this._updateActiveState();
    };
    window.addEventListener("popstate", this._popStateHandler);
  }

  disconnectedCallback() {
    this._removeNavListeners();
    window.removeEventListener("popstate", this._popStateHandler);
  }

  _setupNavListeners() {
    this._removeNavListeners();
    // Listen for clicks on any child with data-page or data-route
    this._navLinks = Array.from(
      this.querySelectorAll("[data-page], [data-route]"),
    );
    this._navLinks.forEach((link) => {
      const pageId = link.getAttribute("data-page");
      const route = link.getAttribute("data-route");
      link.addEventListener("click", this._navClickHandler);
    });

    // Set initial active state
    this._setInitialActiveState();
  }

  _removeNavListeners() {
    if (this._navLinks) {
      this._navLinks.forEach((link) => {
        link.removeEventListener("click", this._navClickHandler);
      });
    }
    this._navLinks = [];
  }

  _onNavClick(e) {
    e.preventDefault();
    const link = e.currentTarget;
    const pageId = link.getAttribute("data-page");
    const route = link.getAttribute("data-route");

    if (pageId) {
      this.navigateToPage(pageId);
      // Update active class
      this._navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      // Dispatch nav-click event for the remote-call-caller-mixin
      const navEvent = new CustomEvent("nav-click", {
        detail: { pageId },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(navEvent);
    } else if (route) {
      const success = this.navigateToRoute(route);
      if (success) {
        // Update active class
        this._navLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
      }
      // Don't dispatch nav-click event for route-based navigation
      // since we handle it directly
    }
  }

  _refreshPageInfo() {
    if (!this._targetPage) return;

    // Since we can't get a return value directly, we'll listen for the page change event
    // to update our state
    this._updateActiveState();
  }

  _updateActiveState() {
    // Update active class based on current page
    this._navLinks?.forEach((link) => {
      const pageId = link.getAttribute("data-page");
      const route = link.getAttribute("data-route");

      // Get the current page from the target component
      const targetElement = document.getElementById(this._targetPage);
      if (targetElement) {
        let router = targetElement;
        if (targetElement.tagName !== "ARS-PAGE") {
          router = targetElement.querySelector("ars-page");
        }
        if (router) {
          const currentPage = (router as any)._currentPage;
          const currentRoute = (router as any)._currentRoute;

          if (pageId && currentPage === pageId) {
            link.classList.add("active");
          } else if (route && currentRoute === route) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        }
      }
    });
  }

  _setInitialActiveState() {
    // Get the current page from the router
    const currentPage = this.getCurrentPage();
    const currentRoute = this.getCurrentRoute();

    // Set active class on the corresponding nav link
    this._navLinks.forEach((link) => {
      const pageId = link.getAttribute("data-page");
      const route = link.getAttribute("data-route");

      if (pageId && pageId === currentPage) {
        link.classList.add("active");
      } else if (route && route === currentRoute) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  // Public methods
  navigateToPage(pageId) {
    if (!this._targetPage) {
      return false;
    }

    const targetElement = document.getElementById(this._targetPage);
    if (!targetElement) {
      return false;
    }

    // Check if target element is the router itself or contains the router
    let router = targetElement;
    if (targetElement.tagName !== "ARS-PAGE") {
      router = targetElement.querySelector("ars-page");
      if (!router) {
        return false;
      }
    }

    const result = (router as any).showPage(pageId);

    if (result && result.success) {
      // Update active class
      this._navLinks.forEach((link) => {
        const linkPageId = link.getAttribute("data-page");
        const linkRoute = link.getAttribute("data-route");
        if (
          linkPageId === pageId ||
          (linkRoute && result.route === linkRoute)
        ) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
      return true;
    }
    return false;
  }

  navigateToRoute(route) {
    if (!this._targetPage) {
      return false;
    }

    const targetElement = document.getElementById(this._targetPage);
    if (!targetElement) {
      return false;
    }

    // Check if target element is the router itself or contains the router
    let router = targetElement;
    if (targetElement.tagName !== "ARS-PAGE") {
      router = targetElement.querySelector("ars-page");
      if (!router) {
        return false;
      }
    }

    const result = (router as any).navigateToRoute(route);

    if (result && result.success) {
      // Update active class
      this._navLinks.forEach((link) => {
        const linkPageId = link.getAttribute("data-page");
        const linkRoute = link.getAttribute("data-route");
        if (
          (linkPageId && linkPageId === result.pageId) ||
          linkRoute === route
        ) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
      return true;
    }
    return false;
  }

  getCurrentPage() {
    if (this._targetPage) {
      const targetElement = document.getElementById(this._targetPage);
      if (targetElement) {
        // Check if target element is the router itself or contains the router
        let router = targetElement;
        if (targetElement.tagName !== "ARS-PAGE") {
          router = targetElement.querySelector("ars-page");
        }
        if (router) {
          const pageInfo = (router as any).getCurrentPage();
          return pageInfo.currentPage; // Extract the current page ID
        }
      }
    }
    return null;
  }

  getCurrentRoute() {
    if (this._targetPage) {
      const targetElement = document.getElementById(this._targetPage);
      if (targetElement) {
        // Check if target element is the router itself or contains the router
        let router = targetElement;
        if (targetElement.tagName !== "ARS-PAGE") {
          router = targetElement.querySelector("ars-page");
        }
        if (router) {
          const routeInfo = (router as any).getCurrentRoute();
          return routeInfo.currentRoute; // Extract the current route
        }
      }
    }
    return null;
  }

  // Public method to allow external re-initialization
  reinitialize() {
    this._setupNavListeners();
    this._setInitialActiveState();
  }

  // Method to be called by the remote-call-caller-mixin
  _callRemote(targetId, methodName, ...args) {
    const detail = {
      targetId,
      method: methodName,
      args,
      timestamp: Date.now(),
    };
    const event = new CustomEvent("remote-call", {
      detail,
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(event);
  }
}

// Register the custom element
customElements.define(
  "ars-page-controller-internal",
  ArsPageControllerInternal,
);

export { ArsPageControllerInternal, ArsPageControllerInternal as default };
