// ARS Page Router Component
// Provides routing functionality for web applications with URL integration
//
// usage:
//  <ars-page id="my-page-router" routes='{"dashboard":"/dashboard","bots":"/bots","settings":{"systemConfig":"/settings/system-config","tradingPairs":"/settings/trading-pairs"}}'>
//    <div id="dashboard">Dashboard page content</div>
//    <div id="bots">Bots page content</div>
//    <div id="settings">Settings page content</div>
//  </ars-page>
//
// Remote call methods:
// - showPage(pageId): Shows the page with the specified ID
// - hidePage(pageId): Hides the page with the specified ID
// - showAllPages(): Shows all pages
// - hideAllPages(): Hides all pages
// - getCurrentPage(): Returns the ID of the currently visible page
// - getPageInfo(): Returns information about the current page and available pages
// - navigateToRoute(route): Navigate to a specific route
// - getCurrentRoute(): Get the current route

import WebComponentBase from "../web-component-base/web-component-base.js";

class ArsPage extends WebComponentBase {
  constructor() {
    super();
    this._currentPage = null;
    this._pages = new Map();
    this._defaultPage = null;
    this._routes = {};
    this._routeToPageMap = new Map();
    this._pageToRouteMap = new Map();
    this._currentRoute = null;
    this._popstateHandler = this._handlePopState.bind(this);
  }

  static get observedAttributes() {
    return ["default-page", "routes", "base-path"];
  }

  static defaultAttributeValue(name) {
    if (name === "routes") {
      return "{}";
    }
    return null;
  }

  static parseAttributeValue(name, value) {
    if (name === "routes") {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.error("Failed to parse routes attribute:", e);
        return {};
      }
    }
    return WebComponentBase.parseAttributeValue(name, value);
  }

  allAttributesChangedCallback(attributes) {
    console.log("[ars-page] allAttributesChangedCallback:", attributes);

    if (attributes.routes) {
      this._routes = attributes.routes;
      this._buildRouteMaps();
    }

    if (attributes["default-page"]) {
      this._defaultPage = attributes["default-page"];
    }
    this._basePath = attributes["base-path"] || "";
  }

  connectedCallback() {
    super.connectedCallback();
    console.log("[ars-page] connectedCallback");

    // Add popstate listener for browser back/forward
    window.addEventListener("popstate", this._popstateHandler);

    this._initializePages();
    this._buildRouteMaps();

    // Check if there's a route in the URL
    const currentPath = window.location.pathname;
    const pageId = this._getPageIdFromRoute(currentPath);

    if (pageId && this._pages.has(pageId)) {
      console.log(
        "[ars-page] Found route in URL:",
        currentPath,
        "-> pageId:",
        pageId,
      );
      this.showPage(pageId);
    } else if (this._defaultPage) {
      console.log("[ars-page] Using default page:", this._defaultPage);
      this.showPage(this._defaultPage);
    } else if (this._pages.size > 0) {
      const firstPageId = this._pages.keys().next().value;
      console.log("[ars-page] Using first page:", firstPageId);
      this.showPage(firstPageId);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("popstate", this._popstateHandler);
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

  _buildRouteMaps() {
    this._routeToPageMap.clear();
    this._pageToRouteMap.clear();

    const processRoutes = (routes, parentKey = null) => {
      console.log(
        "[ars-page] processRoutes called with:",
        routes,
        "parentKey:",
        parentKey,
      );
      Object.entries(routes).forEach(([key, value]) => {
        console.log("[ars-page] Processing key:", key, "value:", value);
        if (typeof value === "string") {
          // The key is the pageId (e.g., "demo-ars-calendar")
          // The value is the route (e.g., "/demos/ars-calendar")
          console.log("[ars-page] Direct mapping:", key, "->", value);
          this._routeToPageMap.set(value, key); // Maps route -> pageId
          this._pageToRouteMap.set(key, value); // Maps pageId -> route
        } else if (typeof value === "object" && value !== null) {
          const parentPageId = parentKey || key;
          console.log(
            "[ars-page] Processing nested routes for parent:",
            parentPageId,
          );

          if (!this._routeToPageMap.has(`/${parentPageId}`)) {
            this._routeToPageMap.set(`/${parentPageId}`, parentPageId);
            this._pageToRouteMap.set(parentPageId, `/${parentPageId}`);
          }

          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            if (typeof nestedValue === "string") {
              console.log(
                "[ars-page] Mapping nested route:",
                nestedValue,
                "->",
                parentPageId,
              );
              this._routeToPageMap.set(nestedValue, parentPageId);
            } else if (typeof nestedValue === "object") {
              processRoutes({ [nestedKey]: nestedValue }, parentPageId);
            }
          });
        }
      });
    };

    processRoutes(this._routes);
    console.log("[ars-page] Route maps built:", {
      routeToPage: Object.fromEntries(this._routeToPageMap),
      pageToRoute: Object.fromEntries(this._pageToRouteMap),
    });
    console.log("[ars-page] Raw routes object:", this._routes);
  }

  _getPageIdFromRoute(route) {
    const rel = route.startsWith(this._basePath)
      ? route.slice(this._basePath.length)
      : route;
    console.log("[ars-page] _getPageIdFromRoute called with:", route, "→", rel);
    console.log(
      "[ars-page] Available routes:",
      Array.from(this._routeToPageMap.keys()),
    );

    // Try exact match first
    if (this._routeToPageMap.has(rel)) {
      const pageId = this._routeToPageMap.get(rel);
      console.log("[ars-page] Exact match found:", route, "->", pageId);
      return pageId;
    }

    // Try partial matches for nested routes
    for (const [routePath, pageId] of this._routeToPageMap) {
      if (rel.startsWith(routePath)) {
        console.log("[ars-page] Partial match found:", routePath, "->", pageId);
        return pageId;
      }
    }

    console.log("[ars-page] No match found for route:", route);
    return null;
  }

  _getRouteFromPageId(pageId) {
    // Get the direct route mapping
    const directRoute = this._pageToRouteMap.get(pageId);
    if (directRoute) {
      return this._basePath + directRoute;
    }

    // If no direct route, return null
    return null;
  }

  _updateBrowserUrl(route) {
    if (route) {
      const abs = this._basePath + route;
      if (abs && abs !== window.location.pathname) {
        window.history.pushState({ pageId: this._currentPage }, "", abs);
        this._currentRoute = abs;
      }
    }
  }

  _handlePopState(event) {
    console.log("[ars-page] Popstate event:", event);
    const currentPath = window.location.pathname;
    console.log("[ars-page] Current path from popstate:", currentPath);

    const pageId = this._getPageIdFromRoute(currentPath);
    console.log("[ars-page] Resolved pageId from popstate:", pageId);

    if (pageId && this._pages.has(pageId)) {
      console.log("[ars-page] Navigating to page from URL:", pageId);
      // Update the current route first so the event has the correct route
      this._currentRoute = currentPath;
      this._showPage(pageId, false); // Don't update URL since we're responding to URL change
      console.log("[ars-page] Updated current route to:", this._currentRoute);
    } else {
      console.log("[ars-page] No valid page found for path:", currentPath);
    }
  }

  _showPage(pageId, updateUrl = true) {
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

    // Update browser URL if requested
    if (updateUrl) {
      const route = this._getRouteFromPageId(pageId);
      this._updateBrowserUrl(route);
    }

    this.dispatchEvent(
      new CustomEvent("ars-page:page-changed", {
        detail: {
          previousPage: this._currentPage,
          currentPage: pageId,
          pageElement: pageElement,
          route: this._currentRoute,
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
    return {
      success,
      pageId,
      currentPage: this._currentPage,
      route: this._currentRoute,
    };
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
      currentRoute: this._currentRoute,
    };
  }

  getPageInfo() {
    return {
      currentPage: this._currentPage,
      availablePages: Array.from(this._pages.keys()),
      totalPages: this._pages.size,
      defaultPage: this._defaultPage,
      currentRoute: this._currentRoute,
      routes: this._routes,
    };
  }

  // New methods for route-based navigation
  navigateToRoute(route) {
    console.log("[ars-page] navigateToRoute called with:", route);
    console.log(
      "[ars-page] Current route maps:",
      Object.fromEntries(this._routeToPageMap),
    );

    const pageId = this._getPageIdFromRoute(route);
    console.log("[ars-page] Resolved pageId:", pageId);

    if (pageId) {
      // Update the current route first so the event has the correct route
      this._currentRoute = route;

      // Show the page without updating URL (we'll do it manually)
      const success = this._showPage(pageId, false);
      if (success) {
        // Update the URL to the specific route, not the page's default route
        this._updateBrowserUrl(route);
        return {
          success: true,
          pageId,
          currentPage: this._currentPage,
          route: this._currentRoute,
        };
      }
      return {
        success: false,
        pageId,
        currentPage: this._currentPage,
        route: this._currentRoute,
      };
    }
    console.error(`ARS Page: No page found for route '${route}'`);
    return { success: false, route, error: "Route not found" };
  }

  getCurrentRoute() {
    return {
      currentRoute: this._currentRoute,
      currentPage: this._currentPage,
      availableRoutes: Array.from(this._routeToPageMap.keys()),
    };
  }
}

// Register the custom element
customElements.define("ars-page", ArsPage);

export { ArsPage, ArsPage as default };
