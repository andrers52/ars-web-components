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
// This component internally uses the remote-call-caller-mixin to communicate with the page router.

import "./ars-page-controller-internal.js";
import "../../mixins/remote-call-mixin/remote-call-caller-mixin.js";

class ArsPageController extends HTMLElement {
  constructor() {
    super();
    this._targetPage = this.getAttribute("target-page") || "";
  }

  connectedCallback() {
    // Create the mixin wrapper directly without shadow DOM
    const mixinWrapper = document.createElement('remote-call-caller-mixin');
    mixinWrapper.setAttribute('target-id', this.getAttribute('target-page') || '');
    mixinWrapper.setAttribute('method', 'showPage');
    mixinWrapper.setAttribute('listen', 'nav-click');
    mixinWrapper.setAttribute('args-map', '{"pageId": 0}');

    // Create the internal component
    const internalComponent = document.createElement('ars-page-controller-internal');
    internalComponent.setAttribute('target-page', this.getAttribute('target-page') || '');

    // Move all child nodes to the internal component
    while (this.firstChild) {
      internalComponent.appendChild(this.firstChild);
    }

    // Add the internal component to the mixin wrapper
    mixinWrapper.appendChild(internalComponent);

    // Replace this element's content with the mixin wrapper
    this.innerHTML = '';
    this.appendChild(mixinWrapper);

    console.log('ArsPageController connectedCallback - Mixin wrapper created');
    console.log('Navigation content moved to internal component');

    // Forward all attributes to the internal component
    this._forwardAttributes();

    // Wait for the router to be fully initialized before setting up the controller
    setTimeout(() => {
      const internalComponent = this.querySelector('ars-page-controller-internal');
      if (internalComponent) {
        console.log('ArsPageController: Router should be ready, triggering internal component setup');
        // Trigger a re-initialization of the internal component
        internalComponent.reinitialize();
      }
    }, 500);
  }

  _forwardAttributes() {
    const internalComponent = this.querySelector('ars-page-controller-internal');
    if (internalComponent) {
      // Forward all attributes except target-page (already set)
      Array.from(this.attributes).forEach(attr => {
        if (attr.name !== 'target-page') {
          internalComponent.setAttribute(attr.name, attr.value);
        }
      });
    }
  }

  // Forward methods to the internal component
  getCurrentPage() {
    const internalComponent = this.querySelector('ars-page-controller-internal');
    return internalComponent ? internalComponent.getCurrentPage() : null;
  }

  navigateToPage(pageId) {
    const internalComponent = this.querySelector('ars-page-controller-internal');
    return internalComponent ? internalComponent.navigateToPage(pageId) : false;
  }

  setNavigationType(type) {
    const internalComponent = this.querySelector('ars-page-controller-internal');
    if (internalComponent) {
      internalComponent.setNavigationType(type);
    }
  }
}

// Register the custom element
customElements.define("ars-page-controller", ArsPageController);

export { ArsPageController, ArsPageController as default };
