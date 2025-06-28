// Functional Refactoring Example
// This file demonstrates how we've refactored the web components to be more functional
// while keeping the class structure intact for the Custom Elements API.

// ============================================================================
// BEFORE: Class-heavy approach with methods
// ============================================================================

/*
class ArsButton extends PressedEffect(HTMLButtonElement) {
  constructor() {
    super();
    this._setStyle();
    this.addEventListener("click", (event) => {
      this._notifyClick(event.detail);
      event.preventDefault();
    });
  }

  _notifyClick(result) {
    if (!this.id) return;
    this.dispatchEvent(
      new CustomEvent(`ars-button:${this.id}:click`, {
        detail: { result },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _setStyle() {
    const effectColor = this.getAttribute("effect-color");
    if (effectColor) {
      this._effectColor = effectColor;
    }
  }
}
*/

// ============================================================================
// AFTER: Functional approach with pure functions
// ============================================================================

// Pure utility functions (no side effects, predictable outputs)
const createClickEventName = (buttonId) => `ars-button:${buttonId}:click`;

const createClickEvent = (buttonId, result) =>
  new CustomEvent(createClickEventName(buttonId), {
    detail: { result },
    bubbles: true,
    composed: true,
  });

const getEffectColor = (element) => element.getAttribute("effect-color");

const hasId = (element) => !!element.id;

// Pure function with clear inputs and outputs
const dispatchClickEvent = (element, result) => {
  if (!hasId(element)) return;
  element.dispatchEvent(createClickEvent(element.id, result));
};

// Higher-order function that returns a function
const createClickHandler = (element) => (event) => {
  dispatchClickEvent(element, event.detail);
  event.preventDefault();
};

// Composition function that combines multiple behaviors
const initializeButton = (button) => {
  const clickHandler = createClickHandler(button);
  button.addEventListener("click", clickHandler);

  const effectColor = getEffectColor(button);
  if (effectColor) {
    button._effectColor = effectColor;
  }

  return button;
};

// The class is now much simpler and delegates to pure functions
class ArsButton extends PressedEffect(HTMLButtonElement) {
  constructor() {
    super();
    initializeButton(this); // Single function call handles all initialization
  }
}

// ============================================================================
// Benefits of this approach:
// ============================================================================

// 1. TESTABILITY: Pure functions are easy to test
const testCreateClickEventName = () => {
  const result = createClickEventName("my-button");
  console.assert(
    result === "ars-button:my-button:click",
    "Event name should be correct",
  );
};

// 2. REUSABILITY: Functions can be used in different contexts
const createGenericClickEvent = (prefix, id, result) =>
  new CustomEvent(`${prefix}:${id}:click`, {
    detail: { result },
    bubbles: true,
    composed: true,
  });

// 3. COMPOSABILITY: Functions can be combined easily
const withClickHandler = (element, eventName) => {
  const handler = (event) => {
    element.dispatchEvent(
      createGenericClickEvent("custom", element.id, event.detail),
    );
  };
  element.addEventListener(eventName, handler);
  return element;
};

// 4. IMMUTABILITY: Pure functions don't modify external state
const processAttributes = (element, attributeNames) => {
  return attributeNames.reduce((acc, name) => {
    acc[name] = element.getAttribute(name);
    return acc;
  }, {});
};

// ============================================================================
// Usage Examples:
// ============================================================================

// Example 1: Testing pure functions
testCreateClickEventName();

// Example 2: Composing behaviors
const createEnhancedButton = (baseElement) => {
  const withClick = withClickHandler(baseElement, "click");
  const withEffect = initializeButton(withClick);
  return withEffect;
};

// Example 3: Processing attributes functionally
const button = document.createElement("button");
button.setAttribute("effect-color", "#ff0000");
button.setAttribute("data-test", "value");

const attributes = processAttributes(button, ["effect-color", "data-test"]);
console.log(attributes); // { "effect-color": "#ff0000", "data-test": "value" }

export {
  ArsButton,
  createClickEvent,
  createClickEventName,
  createClickHandler,
  dispatchClickEvent,
  getEffectColor,
  hasId,
  initializeButton,
};
