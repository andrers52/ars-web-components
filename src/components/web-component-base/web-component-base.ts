"use strict";

// from: http://2ality.com/2014/12/es6-proxies.html (tracePropAccess)

// Pure utility functions
const parseJsonSafely = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
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

// Resolves a dotted property path against the component so event connectors can stay declarative.
const resolveComponentPath = (root, path) => {
  return path.split(".").reduce((currentValue, key) => {
    if (currentValue == null) {
      throw new Error(`Cannot resolve '${path}' from component.`);
    }
    return currentValue[key];
  }, root);
};

// Parses the supported declarative event syntax into a method name and optional primitive/property arguments.
const parseMethodCallExpression = (methodCallStr) => {
  const normalizedMethodCall = methodCallStr.trim().replace(/;$/, "");
  const match = normalizedMethodCall.match(
    /^(?:this\.)?([A-Za-z_$][\w$]*)(?:\((.*)\))?$/,
  );

  if (!match) {
    throw new Error(
      `Unsupported event handler expression '${methodCallStr}'. Use methodName(...) syntax.`,
    );
  }

  const [, methodName, rawArguments = ""] = match;
  const args = rawArguments.trim()
    ? rawArguments.split(",").map((argument) => argument.trim())
    : [];

  return { methodName, args };
};

// Resolves declarative string arguments without executing arbitrary code.
const resolveMethodArgument = (component, argument) => {
  if (!argument.length) {
    return undefined;
  }
  if (argument === "this") {
    return component;
  }
  if (argument.startsWith("this.")) {
    return resolveComponentPath(component, argument.slice(5));
  }
  if (argument === "true") {
    return true;
  }
  if (argument === "false") {
    return false;
  }
  if (argument === "null") {
    return null;
  }
  if (/^-?\d+(\.\d+)?$/.test(argument)) {
    return Number(argument);
  }
  if (
    (argument.startsWith('"') && argument.endsWith('"')) ||
    (argument.startsWith("'") && argument.endsWith("'"))
  ) {
    return argument.slice(1, -1);
  }

  throw new Error(
    `Unsupported event handler argument '${argument}'. Use primitives or component property paths.`,
  );
};

// Factory function for event connection without arbitrary code execution.
const createEventConnector = (elementId, eventStr, methodCallStr) => (self) => {
  const element = self.shadowRoot.getElementById(elementId);
  const { methodName, args } = parseMethodCallExpression(methodCallStr);

  element[eventStr] = function () {
    const method = self[methodName];
    if (typeof method !== "function") {
      throw new Error(`Event connector method '${methodName}' does not exist.`);
    }

    const resolvedArgs = args.map((argument) => resolveMethodArgument(self, argument));
    method.apply(self, resolvedArgs);
  };
};

class WebComponentBase extends HTMLElement {
  [key: string]: any;

  static get observedAttributes() {
    return []; // Override in the subclass to specify observed attributes
  }

  static defaultAttributeValue(_name) {
    return null; // Override in the subclass if needed
  }

  static parseAttributeValue(_name, value) {
    return parseJsonSafely(value);
  }

  constructor() {
    super();
    this.alreadyMappedAttributes = false;
    this._attributesMap = {};
    this._waitingOnAttr = [];

    const observedAttrs = (this.constructor as any).observedAttributes || [];
    this._attributesMap = createInitialAttributesMap(
      this,
      observedAttrs,
      (this.constructor as any).defaultAttributeValue.bind(this.constructor),
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
    // Subclasses may override.
  }

  disconnectedCallback() {
    // Subclasses may override.
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    this._attributesMap[attr] = (this.constructor as any).parseAttributeValue.call(
      this,
      attr,
      newValue,
    );

    if (this._waitingOnAttr.length) {
      removeFromArray(this._waitingOnAttr, attr);
    }

    if (this._waitingOnAttr.length === 0 && !this.alreadyMappedAttributes) {
      this.allAttributesChangedCallback(this._attributesMap);
      this.alreadyMappedAttributes = true;
    }
  }

  emitEvent(name, detail) {
    this.dispatchEvent(createCustomEvent(name, detail));
  }

  allAttributesChangedCallback(attributes) {
    void attributes;
    // Subclasses may override.
  }

  connectElementWithEvent(elementId, eventStr, methodCallStr) {
    const connector = createEventConnector(elementId, eventStr, methodCallStr);
    connector(this);
  }
}

export { WebComponentBase as default, WebComponentBase };
