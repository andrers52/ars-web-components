// Swipeable Mixin
// Adds swipe gesture detection to web components

const SwipeableMixin = (BaseClass) => {
  return class extends BaseClass {
    constructor() {
      super();
      this._touchStartX = 0;
      this._touchStartY = 0;
      this._touchEndX = 0;
      this._touchEndY = 0;
      this._minSwipeDistance = 50;
      this._maxSwipeTime = 300;
      this._touchStartTime = 0;
    }

    // Public static methods
    static get observedAttributes() {
      return ["min-swipe-distance", "max-swipe-time"];
    }

    // Private utility functions
    #validateDistance(distance) {
      const num = parseInt(distance);
      return !isNaN(num) && num > 0;
    }

    #validateTime(time) {
      const num = parseInt(time);
      return !isNaN(num) && num > 0;
    }

    #getTouchCoordinates(event) {
      const touch = event.touches[0] || event.changedTouches[0];
      return {
        x: touch.clientX,
        y: touch.clientY,
      };
    }

    #calculateSwipeDistance() {
      const deltaX = this._touchEndX - this._touchStartX;
      const deltaY = this._touchEndY - this._touchStartY;

      return {
        deltaX,
        deltaY,
        distance: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
      };
    }

    #calculateSwipeTime() {
      return Date.now() - this._touchStartTime;
    }

    #determineSwipeDirection(deltaX, deltaY) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY) {
        return deltaX > 0 ? "right" : "left";
      } else {
        return deltaY > 0 ? "down" : "up";
      }
    }

    #isValidSwipe(distance, time) {
      return distance >= this._minSwipeDistance && time <= this._maxSwipeTime;
    }

    #handleTouchStart = (event) => {
      const coords = this.#getTouchCoordinates(event);
      this._touchStartX = coords.x;
      this._touchStartY = coords.y;
      this._touchStartTime = Date.now();
    };

    #handleTouchEnd = (event) => {
      const coords = this.#getTouchCoordinates(event);
      this._touchEndX = coords.x;
      this._touchEndY = coords.y;

      const { deltaX, deltaY, distance } = this.#calculateSwipeDistance();
      const time = this.#calculateSwipeTime();

      if (this.#isValidSwipe(distance, time)) {
        const direction = this.#determineSwipeDirection(deltaX, deltaY);
        this.onSwipe(direction, { deltaX, deltaY, distance, time });
      }
    };

    // Public instance methods - override this in your component
    onSwipe(direction, details) {
      // Default implementation - override in your component
      console.log(`Swipe detected: ${direction}`, details);

      // Dispatch custom event
      const event = new CustomEvent("swipe", {
        detail: {
          direction,
          ...details,
        },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    }

    setMinSwipeDistance(distance) {
      if (this.#validateDistance(distance)) {
        this._minSwipeDistance = parseInt(distance);
      }
    }

    setMaxSwipeTime(time) {
      if (this.#validateTime(time)) {
        this._maxSwipeTime = parseInt(time);
      }
    }

    // Lifecycle methods
    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }

      const distance = this.getAttribute("min-swipe-distance");
      if (this.#validateDistance(distance)) {
        this._minSwipeDistance = parseInt(distance);
      }

      const time = this.getAttribute("max-swipe-time");
      if (this.#validateTime(time)) {
        this._maxSwipeTime = parseInt(time);
      }

      this.addEventListener("touchstart", this.#handleTouchStart);
      this.addEventListener("touchend", this.#handleTouchEnd);
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }

      this.removeEventListener("touchstart", this.#handleTouchStart);
      this.removeEventListener("touchend", this.#handleTouchEnd);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(name, oldValue, newValue);
      }

      if (name === "min-swipe-distance" && this.#validateDistance(newValue)) {
        this._minSwipeDistance = parseInt(newValue);
      } else if (name === "max-swipe-time" && this.#validateTime(newValue)) {
        this._maxSwipeTime = parseInt(newValue);
      }
    }
  };
};

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = SwipeableMixin;
} else if (typeof window !== "undefined") {
  window.SwipeableMixin = SwipeableMixin;
}

export { SwipeableMixin };
