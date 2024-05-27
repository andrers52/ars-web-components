"use strict";

// from: http://2ality.com/2014/12/es6-proxies.html (tracePropAccess)

// Helper function to map properties to attributes
function mapPropertiesToAttributes(obj, propKeys) {
  propKeys.forEach(function (propKey) {
    try {
      Object.defineProperty(obj, propKey, {
        get: function () {
          let attr = this.getAttribute(propKey);
          try {
            return JSON.parse(attr);
          } catch (e) {
            return attr;
          }
        },
        set: function (value) {
          this.setAttribute(
            propKey,
            typeof value === "string" ? value : JSON.stringify(value),
          );
        },
      });
    } catch (err) {
      console.error(`Error mapping property '${propKey}':`, err);
    }
  });
  return obj;
}

class WebComponentBase extends HTMLElement {
  static get observedAttributes() {
    return []; // Override in the subclass to specify observed attributes
  }

  static defaultAttributeValue(name) {
    return null; // Override in the subclass if needed
  }

  static parseAttributeValue(name, value) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value; // Return as string if parsing fails
    }
  }

  constructor() {
    super();
    this.alreadyMappedAttributes = false;
    this._attributesMap = {};
    this._waitingOnAttr = [];

    this._waitingOnAttr = (this.constructor.observedAttributes || []).filter(
      (name) => {
        if (!this.attributes.getNamedItem(name)) {
          this._attributesMap[name] =
            this.constructor.defaultAttributeValue(name);
        }
        return !!this.attributes.getNamedItem(name);
      },
    );

    // No attributes so update attribute never called.
    // SO fire this anyway.
    if (this._waitingOnAttr.length === 0) {
      // RUN THIS AFTER A TIME INTERVAL TO ALLOW CHILD CONSTRUCTOR TO RUN ***
      setTimeout(() => {
        this.allAttributesChangedCallback(this._attributesMap);
      }, 0);
    }
  }

  connectedCallback() {
    console.log("Component connected to the DOM.");
  }

  disconnectedCallback() {
    console.log("Component disconnected from the DOM.");
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    this._attributesMap[attr] = this.constructor.parseAttributeValue.call(
      this,
      attr,
      newValue,
    );

    if (this._waitingOnAttr.length) {
      const index = this._waitingOnAttr.indexOf(attr);
      if (index !== -1) {
        // Remove it from array.
        this._waitingOnAttr.splice(index, 1);
      }
    }

    if (this._waitingOnAttr.length === 0 && !this.alreadyMappedAttributes) {
      mapPropertiesToAttributes(this, Object.keys(this._attributesMap));
      this.allAttributesChangedCallback(this._attributesMap);
      this.alreadyMappedAttributes = true;
    }
  }

  emitEvent(name, detail) {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true }),
    );
  }

  allAttributesChangedCallback(attributes) {
    // Override in the subclass to handle changes to all attributes
    console.log("All attributes have changed:", attributes);
  }

  connectElementWithEvent(elementId, eventStr, methodCallStr) {
    let self = this;
    this.shadowRoot.getElementById(elementId)[eventStr] = function () {
      eval(`${methodCallStr.replace(/this/g, "self")}`);
    };
  }
}

export { WebComponentBase, WebComponentBase as default };
