// Pressed Effect Mixin
// Adds visual feedback when the element is pressed/clicked

const PressedEffectMixin = (BaseClass) => {
  return class extends BaseClass {
    constructor() {
      super();
      this._isPressed = false;
      this._pressedClass = "pressed";
      this._pressedDuration = 150;
      this._pressTimer = null;
    }

    // Public static methods
    static get observedAttributes() {
      return ["pressed-class", "pressed-duration"];
    }

    // Private utility functions
    #validateClassName(className) {
      return typeof className === "string" && className.trim().length > 0;
    }

    #validateDuration(duration) {
      const num = parseInt(duration);
      return !isNaN(num) && num >= 0;
    }

    #addPressedClass() {
      if (this.#validateClassName(this._pressedClass)) {
        this.classList.add(this._pressedClass);
      }
    }

    #removePressedClass() {
      if (this.#validateClassName(this._pressedClass)) {
        this.classList.remove(this._pressedClass);
      }
    }

    #clearPressTimer() {
      if (this._pressTimer) {
        clearTimeout(this._pressTimer);
        this._pressTimer = null;
      }
    }

    #schedulePressEnd() {
      this.#clearPressTimer();
      this._pressTimer = setTimeout(() => {
        this.#endPress();
      }, this._pressedDuration);
    }

    #startPress() {
      if (this._isPressed) {
        return;
      }

      this._isPressed = true;
      this.#addPressedClass();
      this.onPressStart();
    }

    #endPress() {
      if (!this._isPressed) {
        return;
      }

      this._isPressed = false;
      this.#removePressedClass();
      this.#clearPressTimer();
      this.onPressEnd();
    }

    // Event handlers
    #handleMouseDown = (event) => {
      if (event.button === 0) {
        // Left mouse button only
        this.#startPress();
      }
    };

    #handleMouseUp = (event) => {
      if (event.button === 0) {
        // Left mouse button only
        this.#endPress();
      }
    };

    #handleMouseLeave = () => {
      this.#endPress();
    };

    #handleTouchStart = (event) => {
      this.#startPress();
    };

    #handleTouchEnd = (event) => {
      this.#schedulePressEnd();
    };

    #handleTouchCancel = () => {
      this.#endPress();
    };

    // Public instance methods - override these in your component
    onPressStart() {
      // Default implementation - override in your component
      console.log("Press started");
    }

    onPressEnd() {
      // Default implementation - override in your component
      console.log("Press ended");
    }

    setPressedClass(className) {
      if (this.#validateClassName(className)) {
        this._pressedClass = className;
      }
    }

    setPressedDuration(duration) {
      if (this.#validateDuration(duration)) {
        this._pressedDuration = parseInt(duration);
      }
    }

    isPressed() {
      return this._isPressed;
    }

    // Lifecycle methods
    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }

      const pressedClass = this.getAttribute("pressed-class");
      if (this.#validateClassName(pressedClass)) {
        this._pressedClass = pressedClass;
      }

      const duration = this.getAttribute("pressed-duration");
      if (this.#validateDuration(duration)) {
        this._pressedDuration = parseInt(duration);
      }

      // Add event listeners
      this.addEventListener("mousedown", this.#handleMouseDown);
      this.addEventListener("mouseup", this.#handleMouseUp);
      this.addEventListener("mouseleave", this.#handleMouseLeave);
      this.addEventListener("touchstart", this.#handleTouchStart);
      this.addEventListener("touchend", this.#handleTouchEnd);
      this.addEventListener("touchcancel", this.#handleTouchCancel);
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }

      this.#clearPressTimer();

      // Remove event listeners
      this.removeEventListener("mousedown", this.#handleMouseDown);
      this.removeEventListener("mouseup", this.#handleMouseUp);
      this.removeEventListener("mouseleave", this.#handleMouseLeave);
      this.removeEventListener("touchstart", this.#handleTouchStart);
      this.removeEventListener("touchend", this.#handleTouchEnd);
      this.removeEventListener("touchcancel", this.#handleTouchCancel);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(name, oldValue, newValue);
      }

      if (name === "pressed-class" && this.#validateClassName(newValue)) {
        this._pressedClass = newValue;
      } else if (
        name === "pressed-duration" &&
        this.#validateDuration(newValue)
      ) {
        this._pressedDuration = parseInt(newValue);
      }
    }
  };
};

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = PressedEffectMixin;
} else if (typeof window !== "undefined") {
  window.PressedEffectMixin = PressedEffectMixin;
}

export { PressedEffectMixin };
