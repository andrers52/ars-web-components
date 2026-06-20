"use strict";

// from: http://2ality.com/2014/12/es6-proxies.html (tracePropAccess)

// Pure utility functions
const parseJsonSafely = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

// Pure function to create event
const createCustomEvent = (name: string, detail: unknown) =>
  new CustomEvent(name, { detail, bubbles: true, composed: true });

// Pure function to filter observed attributes
const filterObservedAttributes = (
  attributes: NamedNodeMap,
  observedAttrs: string[],
) => observedAttrs.filter((name) => !!attributes.getNamedItem(name));

// Pure function to create initial attributes map
const createInitialAttributesMap = (
  element: HTMLElement,
  observedAttrs: string[],
  defaultValueFn: (name: string) => unknown,
) => {
  const attributesMap: Record<string, unknown> = {};
  observedAttrs.forEach((name) => {
    if (!element.attributes.getNamedItem(name)) {
      attributesMap[name] = defaultValueFn(name);
    }
  });
  return attributesMap;
};

// Pure function to remove item from array
const removeFromArray = <T>(array: T[], item: T) => {
  const index = array.indexOf(item);
  if (index !== -1) {
    array.splice(index, 1);
  }
  return array;
};

// Resolves a dotted property path against the component so event connectors can stay declarative.
const resolveComponentPath = (root: unknown, path: string) => {
  return path.split(".").reduce((currentValue: unknown, key: string) => {
    if (currentValue == null) {
      throw new Error(`Cannot resolve '${path}' from component.`);
    }
    return (currentValue as Record<string, unknown>)[key];
  }, root);
};

// Parses the supported declarative event syntax into a method name and optional primitive/property arguments.
const parseMethodCallExpression = (methodCallStr: string) => {
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
const resolveMethodArgument = (
  component: WebComponentBase,
  argument: string,
) => {
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
const createEventConnector = (
  elementId: string,
  eventStr: string,
  methodCallStr: string,
) =>
  (self: WebComponentBase) => {
    const element = self.shadowRoot?.getElementById(elementId);
    if (!element) {
      throw new Error(`Event connector element '${elementId}' does not exist.`);
    }
    const { methodName, args } = parseMethodCallExpression(methodCallStr);

    (element as HTMLElement & Record<string, unknown>)[eventStr] = function () {
      const method = self[methodName] as unknown;
      if (typeof method !== "function") {
        throw new Error(`Event connector method '${methodName}' does not exist.`);
      }

      const resolvedArgs = args.map((argument) =>
        resolveMethodArgument(self, argument),
      );
      (method as (...args: unknown[]) => unknown).apply(self, resolvedArgs);
    };
  };

class WebComponentBase extends HTMLElement {
  [key: string]: any;

  // ── Repaint coalescing ─────────────────────────────────────────────
  // brainiac's DOMSidebandReconciler re-sets all properties every frame.
  // These utilities let subclasses skip redundant work.

  #_repaintScheduled = false;

  /**
   * Schedule a repaint on the next animation frame, coalescing multiple
   * calls within the same frame into a single `paint()` invocation.
   * Subclasses that use canvas rendering should override `paint()`.
   */
  scheduleRepaint(): void {
    if (this.#_repaintScheduled) return;
    this.#_repaintScheduled = true;
    requestAnimationFrame(() => {
      this.#_repaintScheduled = false;
      if (typeof (this as any).paint === 'function') {
        (this as any).paint();
      }
    });
  }

  /**
   * Cheap array comparison: same length + same first/last element.
   * Catches the common case where the reconciler re-sets identical data
   * every frame, without a full deep-equality scan.
   *
   * @param key  Optional property key to compare on object arrays
   *             (e.g. "time" for CandleDataPoint[], "index" for markers).
   */
  arraysMatch<T>(a: T[], b: T[], key?: keyof T): boolean {
    if (a.length !== b.length) return false;
    if (a.length === 0) return true;
    const first = key ? a[0]?.[key] : a[0];
    const last = key ? a[a.length - 1]?.[key] : a[a.length - 1];
    const prevFirst = key ? b[0]?.[key] : b[0];
    const prevLast = key ? b[b.length - 1]?.[key] : b[b.length - 1];
    return first === prevFirst && last === prevLast;
  }

  // ── Standard lifecycle ─────────────────────────────────────────────

  static get observedAttributes(): string[] {
    return []; // Override in the subclass to specify observed attributes
  }

  static defaultAttributeValue(_name: string): unknown {
    return null; // Override in the subclass if needed
  }

  static parseAttributeValue(_name: string, value: string | null): unknown {
    return parseJsonSafely(value ?? "");
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

  attributeChangedCallback(
    attr: string,
    _oldValue: string | null,
    newValue: string | null,
  ) {
    this._attributesMap[attr] = (
      this.constructor as typeof WebComponentBase
    ).parseAttributeValue.call(this, attr, newValue);

    if (this._waitingOnAttr.length) {
      removeFromArray(this._waitingOnAttr, attr);
    }

    if (this._waitingOnAttr.length === 0 && !this.alreadyMappedAttributes) {
      this.allAttributesChangedCallback(this._attributesMap);
      this.alreadyMappedAttributes = true;
    }
  }

  emitEvent(name: string, detail: unknown) {
    this.dispatchEvent(createCustomEvent(name, detail));
  }

  allAttributesChangedCallback(_attributes: Record<string, unknown>) {
    // Subclasses may override.
  }

  connectElementWithEvent(
    elementId: string,
    eventStr: string,
    methodCallStr: string,
  ) {
    const connector = createEventConnector(elementId, eventStr, methodCallStr);
    connector(this);
  }
}

export { WebComponentBase as default, WebComponentBase };
