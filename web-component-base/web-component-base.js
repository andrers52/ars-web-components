"use strict";

// from: http://2ality.com/2014/12/es6-proxies.html (tracePropAccess)

// Pure utility functions
const parseJsonSafely = (value) => {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
};

const stringifySafely = (value) => {
  return typeof value === "string" ? value : JSON.stringify(value);
};

const getAttributeValue = (element, propKey) => {
  const attr = element.getAttribute(propKey);
  return parseJsonSafely(attr);
};

const setAttributeValue = (element, propKey, value) => {
  element.setAttribute(propKey, stringifySafely(value));
};

// Pure function to create property descriptor
const createPropertyDescriptor = (propKey) => ({
  get() {
    return getAttributeValue(this, propKey);
  },
  set(value) {
    setAttributeValue(this, propKey, value);
  },
});

// Pure function to map properties to attributes
const mapPropertiesToAttributes = (obj, propKeys) => {
  propKeys.forEach((propKey) => {
    try {
      Object.defineProperty(obj, propKey, createPropertyDescriptor(propKey));
    } catch (err) {
      console.error(`Error mapping property '${propKey}':`, err);
    }
  });
  return obj;
};

// Pure function to create event
const createCustomEvent = (name, detail) =>
  new CustomEvent(name, { detail, bubbles: true, composed: true });

// Pure function to filter observed attributes
const filterObservedAttributes = (attributes, observedAttrs) =>
  observedAttrs.filter((name) => !!attributes.getNamedItem(name));

// Pure function to create initial attributes map
const createInitialAttributesMap = (element, observedAttrs, defaultValueFn) => {
  const attributesMap = {};
  observedAttrs.forEach((name) => {
    if (!element.attributes.getNamedItem(name)) {
      attributesMap[name] = defaultValueFn(name);
    }
  });
  return attributesMap;
};

// Pure function to remove item from array
const removeFromArray = (array, item) => {
  const index = array.indexOf(item);
  if (index !== -1) {
    array.splice(index, 1);
  }
  return array;
};

// Factory function for event connection
const createEventConnector = (elementId, eventStr, methodCallStr) => (self) => {
  self.shadowRoot.getElementById(elementId)[eventStr] = function () {
    eval(`${methodCallStr.replace(/this/g, "self")}`);
  };
};

class WebComponentBase extends HTMLElement {
  static get observedAttributes() {
    return []; // Override in the subclass to specify observed attributes
  }

  static defaultAttributeValue(name) {
    return null; // Override in the subclass if needed
  }

  static parseAttributeValue(name, value) {
    return parseJsonSafely(value);
  }

  constructor() {
    super();
    this.alreadyMappedAttributes = false;
    this._attributesMap = {};
    this._waitingOnAttr = [];

    const observedAttrs = this.constructor.observedAttributes || [];
    this._attributesMap = createInitialAttributesMap(
      this,
      observedAttrs,
      this.constructor.defaultAttributeValue.bind(this.constructor),
    );

    this._waitingOnAttr = filterObservedAttributes(
      this.attributes,
      observedAttrs,
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
      removeFromArray(this._waitingOnAttr, attr);
    }

    if (this._waitingOnAttr.length === 0 && !this.alreadyMappedAttributes) {
      mapPropertiesToAttributes(this, Object.keys(this._attributesMap));
      this.allAttributesChangedCallback(this._attributesMap);
      this.alreadyMappedAttributes = true;
    }
  }

  emitEvent(name, detail) {
    this.dispatchEvent(createCustomEvent(name, detail));
  }

  allAttributesChangedCallback(attributes) {
    // Override in the subclass to handle changes to all attributes
    console.log("All attributes have changed:", attributes);
  }

  connectElementWithEvent(elementId, eventStr, methodCallStr) {
    const connector = createEventConnector(elementId, eventStr, methodCallStr);
    connector(this);
  }
}

export { WebComponentBase as default, WebComponentBase };
