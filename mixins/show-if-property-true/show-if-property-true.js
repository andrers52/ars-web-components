// Show If Property True Mixin
// Shows/hides the element based on a property value

const ShowIfPropertyTrueMixin = (BaseClass) => {
  return class extends BaseClass {
    constructor() {
      super();
      this._showProperty = null;
      this._originalDisplay = null;
    }

    // Public static methods
    static get observedAttributes() {
      return ["show-if-property"];
    }

    // Private utility functions
    #validateProperty(property) {
      return typeof property === "string" && property.trim().length > 0;
    }

    #getPropertyValue(property) {
      if (!this.#validateProperty(property)) {
        return false;
      }

      // Check if property exists on the element
      if (property in this) {
        return Boolean(this[property]);
      }

      // Check if it's a data attribute
      const dataAttr = this.getAttribute(`data-${property}`);
      if (dataAttr !== null) {
        return dataAttr === "true" || dataAttr === "1";
      }

      // Check if it's a regular attribute
      const attr = this.getAttribute(property);
      if (attr !== null) {
        return attr === "true" || attr === "1";
      }

      return false;
    }

    #storeOriginalDisplay() {
      if (this._originalDisplay === null) {
        const computedStyle = window.getComputedStyle(this);
        this._originalDisplay = computedStyle.display;
      }
    }

    #updateVisibility() {
      if (!this._showProperty) return;
      this.#storeOriginalDisplay();
      const shouldShow = this.#getPropertyValue(this._showProperty);
      const content = this.querySelector(".conditional-content");
      const keepSpace =
        this.hasAttribute("keep-space-when-hidden") || this.keepSpaceWhenHidden;

      if (content) {
        if (shouldShow) {
          content.style.display = "";
          content.style.visibility = "";
        } else if (keepSpace) {
          content.style.display = "";
          content.style.visibility = "hidden";
        } else {
          content.style.display = "none";
          content.style.visibility = "";
        }
      } else {
        if (shouldShow) {
          this.style.display = this._originalDisplay || "block";
          this.style.visibility = "";
        } else if (keepSpace) {
          this.style.display = this._originalDisplay || "block";
          this.style.visibility = "hidden";
        } else {
          this.style.display = "none";
          this.style.visibility = "";
        }
      }
    }

    // Public instance methods
    setShowProperty(property) {
      if (this.#validateProperty(property)) {
        this._showProperty = property;
        this.#updateVisibility();
      }
    }

    getShowProperty() {
      return this._showProperty;
    }

    refreshVisibility() {
      this.#updateVisibility();
    }

    // Lifecycle methods
    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }

      const property = this.getAttribute("show-if-property");
      if (this.#validateProperty(property)) {
        this._showProperty = property;
        this.#updateVisibility();
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(name, oldValue, newValue);
      }

      if (name === "show-if-property") {
        if (this.#validateProperty(newValue)) {
          this._showProperty = newValue;
          this.#updateVisibility();
        } else {
          this._showProperty = null;
          this.style.display = this._originalDisplay || "";
        }
      }
    }
  };
};

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ShowIfPropertyTrueMixin;
} else if (typeof window !== "undefined") {
  window.ShowIfPropertyTrueMixin = ShowIfPropertyTrueMixin;
}

export { ShowIfPropertyTrueMixin };
