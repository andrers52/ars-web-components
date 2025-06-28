// usage:
//  <button
//    is="ars-button"
//    id="<button_id>" <-- if provided will send click event
//    class="your-css-classes" <-- style with regular CSS classes
//    effect-color="#hex-color" <-- optional: color for pressed effect animation
//  </button>
//
// notification event: `ars-button:<button_id>:click`

import { PressedEffectMixin } from "../mixins/pressed-effect/pressed-effect.js";

class ArsButton extends PressedEffectMixin(HTMLButtonElement) {
  constructor() {
    super();
    ArsButton.#initializeButton(this);
  }

  static get observedAttributes() {
    return ["effect-color"];
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    if (attrName === "effect-color") {
      this._effectColor = newVal;
    }
  }

  // ---- PRIVATE STATIC UTILITY METHODS ----
  static #createClickEventName(buttonId) {
    return `ars-button:${buttonId}:click`;
  }

  static #createClickEvent(buttonId, result) {
    return new CustomEvent(this.#createClickEventName(buttonId), {
      detail: { result },
      bubbles: true,
      composed: true,
    });
  }

  static #getEffectColor(element) {
    return element.getAttribute("effect-color");
  }

  static #hasId(element) {
    return !!element.id;
  }

  static #dispatchClickEvent(element, result) {
    if (!this.#hasId(element)) return;
    element.dispatchEvent(this.#createClickEvent(element.id, result));
  }

  static #createClickHandler(element) {
    return (event) => {
      this.#dispatchClickEvent(element, event.detail);
      event.preventDefault();
    };
  }

  static #initializeButton(button) {
    const clickHandler = this.#createClickHandler(button);
    button.addEventListener("click", clickHandler);
    const effectColor = this.#getEffectColor(button);
    if (effectColor) {
      button._effectColor = effectColor;
    }
    return button;
  }
}

window.customElements.define("ars-button", ArsButton, { extends: "button" });

export { ArsButton, ArsButton as default };
