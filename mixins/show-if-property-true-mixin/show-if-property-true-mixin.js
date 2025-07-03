// Show If Property True Mixin - declarative conditional visibility
// Usage:
//   <show-if-property-true-mixin show-if-property="isVisible">
//     <div>This content shows/hides based on the property</div>
//   </show-if-property-true-mixin>
// Provides setShowProperty(), getShowProperty(), refreshVisibility(), etc.

import WebComponentBase from '../../components/web-component-base/web-component-base.js';

class ShowIfPropertyTrueMixin extends WebComponentBase {
  static get observedAttributes() { return ['show-if-property']; }

  constructor() {
    super();
    this._showProperty = null;
    this._originalDisplay = null;

    // simple shadow that just renders children "as-is"
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>:host{display:contents}</style><slot></slot>`;
  }

  /* --------------------------------------------------
   *  Private utility functions
   * -------------------------------------------------- */
  #validateProperty(property) {
    return typeof property === "string" && property.trim().length > 0;
  }

  #getPropertyValue(property) {
    if (!this.#validateProperty(property)) {
      return false;
    }

    // Get the target component (first child element)
    const targetComponent = this.firstElementChild;
    if (!targetComponent) {
      return false;
    }

    // Check if property exists on the target component
    if (property in targetComponent) {
      return Boolean(targetComponent[property]);
    }

    // Check if it's a data attribute on the target component
    const dataAttr = targetComponent.getAttribute(`data-${property}`);
    if (dataAttr !== null) {
      return dataAttr === "true" || dataAttr === "1";
    }

    // Check if it's a regular attribute on the target component
    const attr = targetComponent.getAttribute(property);
    if (attr !== null) {
      return attr === "true" || attr === "1";
    }

    return false;
  }

  #storeOriginalDisplay() {
    if (this._originalDisplay === null) {
      const targetComponent = this.firstElementChild;
      if (targetComponent) {
        const computedStyle = window.getComputedStyle(targetComponent);
        this._originalDisplay = computedStyle.display;
      }
    }
  }

  #updateVisibility() {
    if (!this._showProperty) return;

    const targetComponent = this.firstElementChild;
    if (!targetComponent) return;

    this.#storeOriginalDisplay();
    const shouldShow = this.#getPropertyValue(this._showProperty);
    const keepSpace = this.hasAttribute("keep-space-when-hidden") || this.keepSpaceWhenHidden;

    if (shouldShow) {
      targetComponent.style.display = this._originalDisplay || "block";
      targetComponent.style.visibility = "";
    } else if (keepSpace) {
      targetComponent.style.display = this._originalDisplay || "block";
      targetComponent.style.visibility = "hidden";
    } else {
      targetComponent.style.display = "none";
      targetComponent.style.visibility = "";
    }
  }

  /* --------------------------------------------------
   *  Public API
   * -------------------------------------------------- */
  setShowProperty(property) {
    if (this.#validateProperty(property)) {
      this._showProperty = property;
      this.setAttribute('show-if-property', property);
      this.#updateVisibility();
    }
  }

  getShowProperty() {
    return this._showProperty;
  }

  refreshVisibility() {
    this.#updateVisibility();
  }

  /* --------------------------------------------------
   *  Lifecycle
   * -------------------------------------------------- */
  connectedCallback() {
    super.connectedCallback?.();
    console.log('👁️ ShowIfPropertyTrueMixin connected');

    const property = this.getAttribute("show-if-property");
    if (this.#validateProperty(property)) {
      this._showProperty = property;
      // Update visibility after a short delay to ensure children are ready
      setTimeout(() => {
        this.#updateVisibility();
      }, 0);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    super.attributeChangedCallback?.(name, oldValue, newValue);

    if (name === "show-if-property") {
      if (this.#validateProperty(newValue)) {
        this._showProperty = newValue;
        this.#updateVisibility();
      } else {
        this._showProperty = null;
        const targetComponent = this.firstElementChild;
        if (targetComponent) {
          targetComponent.style.display = this._originalDisplay || "";
        }
      }
    }
  }
}

customElements.define('show-if-property-true-mixin', ShowIfPropertyTrueMixin);

export { ShowIfPropertyTrueMixin };
