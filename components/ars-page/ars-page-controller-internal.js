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
    console.log(
      "ArsPageControllerInternal connectedCallback - target-page:",
      this._targetPage,
    );
    console.log("Internal component children:", this.children);

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
    console.log(
      "ArsPageControllerInternal _setupNavListeners - found nav links:",
      this._navLinks.length,
    );
    this._navLinks.forEach((link) => {
      const pageId = link.getAttribute("data-page");
      const route = link.getAttribute("data-route");
      console.log(
        "Adding click listener to:",
        link,
        "with data-page:",
        pageId,
        "data-route:",
        route,
      );
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
    console.log("ArsPageControllerInternal _onNavClick triggered:", e);
    e.preventDefault();
    const link = e.currentTarget;
    const pageId = link.getAttribute("data-page");
    const route = link.getAttribute("data-route");

    console.log("Clicked link with pageId:", pageId, "route:", route);

    if (pageId) {
      this.navigateToPage(pageId);
      // Update active class
      this._navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      // Dispatch nav-click event for the remote-call-caller-mixin
      console.log("Dispatching nav-click event with pageId:", pageId);
      const navEvent = new CustomEvent("nav-click", {
        detail: { pageId },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(navEvent);
      console.log("nav-click event dispatched");
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
          const currentPage = router._currentPage;
          const currentRoute = router._currentRoute;

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
    console.log("Setting initial active state");
    // Get the current page from the router
    const currentPage = this.getCurrentPage();
    const currentRoute = this.getCurrentRoute();
    console.log("Current page from router:", currentPage);
    console.log("Current route from router:", currentRoute);

    // Set active class on the corresponding nav link
    this._navLinks.forEach((link) => {
      const pageId = link.getAttribute("data-page");
      const route = link.getAttribute("data-route");

      console.log(
        "Checking nav link:",
        link,
        "with pageId:",
        pageId,
        "route:",
        route,
        "against currentPage:",
        currentPage,
        "currentRoute:",
        currentRoute,
      );

      if (pageId && pageId === currentPage) {
        link.classList.add("active");
        console.log("Set active class on:", link, "for page:", pageId);
      } else if (route && route === currentRoute) {
        link.classList.add("active");
        console.log("Set active class on:", link, "for route:", route);
      } else {
        link.classList.remove("active");
      }
    });
  }

  // Public methods
  navigateToPage(pageId) {
    console.log(
      "ArsPageControllerInternal navigateToPage called with:",
      pageId,
    );
    if (!this._targetPage) {
      console.log("No target page set, returning false");
      return false;
    }

    const targetElement = document.getElementById(this._targetPage);
    if (!targetElement) {
      console.log("Target element not found:", this._targetPage);
      return false;
    }

    // Check if target element is the router itself or contains the router
    let router = targetElement;
    if (targetElement.tagName !== "ARS-PAGE") {
      router = targetElement.querySelector("ars-page");
      if (!router) {
        console.log("Router component not found in target element");
        return false;
      }
    }

    console.log("Calling router.showPage with:", pageId);
    const result = router.showPage(pageId);
    console.log("Router.showPage result:", result);

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
          console.log("Set active class on:", link);
        } else {
          link.classList.remove("active");
        }
      });
      return true;
    }

    console.log("Navigation failed");
    return false;
  }

  navigateToRoute(route) {
    console.log(
      "ArsPageControllerInternal navigateToRoute called with:",
      route,
    );
    if (!this._targetPage) {
      console.log("No target page set, returning false");
      return false;
    }

    const targetElement = document.getElementById(this._targetPage);
    if (!targetElement) {
      console.log("Target element not found:", this._targetPage);
      return false;
    }

    // Check if target element is the router itself or contains the router
    let router = targetElement;
    if (targetElement.tagName !== "ARS-PAGE") {
      router = targetElement.querySelector("ars-page");
      if (!router) {
        console.log("Router component not found in target element");
        return false;
      }
    }

    console.log("Calling router.navigateToRoute with:", route);
    const result = router.navigateToRoute(route);
    console.log("Router.navigateToRoute result:", result);

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
          console.log("Set active class on:", link);
        } else {
          link.classList.remove("active");
        }
      });
      return true;
    }

    console.log("Route navigation failed");
    return false;
  }

  getCurrentPage() {
    console.log("ArsPageControllerInternal getCurrentPage called");
    if (this._targetPage) {
      const targetElement = document.getElementById(this._targetPage);
      if (targetElement) {
        // Check if target element is the router itself or contains the router
        let router = targetElement;
        if (targetElement.tagName !== "ARS-PAGE") {
          router = targetElement.querySelector("ars-page");
        }
        if (router) {
          const pageInfo = router.getCurrentPage();
          console.log("Got page info from router:", pageInfo);
          return pageInfo.currentPage; // Extract the current page ID
        }
      }
    }
    console.log("Could not get current page, returning null");
    return null;
  }

  getCurrentRoute() {
    console.log("ArsPageControllerInternal getCurrentRoute called");
    if (this._targetPage) {
      const targetElement = document.getElementById(this._targetPage);
      if (targetElement) {
        // Check if target element is the router itself or contains the router
        let router = targetElement;
        if (targetElement.tagName !== "ARS-PAGE") {
          router = targetElement.querySelector("ars-page");
        }
        if (router) {
          const routeInfo = router.getCurrentRoute();
          console.log("Got route info from router:", routeInfo);
          return routeInfo.currentRoute; // Extract the current route
        }
      }
    }
    console.log("Could not get current route, returning null");
    return null;
  }

  // Public method to allow external re-initialization
  reinitialize() {
    console.log("ArsPageControllerInternal reinitialize called");
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
