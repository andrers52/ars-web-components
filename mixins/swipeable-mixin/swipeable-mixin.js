import WebComponentBase from '../../components/web-component-base/web-component-base.js';
import { MixinBase } from '../common/mixin-base.js';

// SwipeableMixin - declarative web component for swipe gesture detection
// Usage:
//   <swipeable-mixin min-swipe-distance="30" max-swipe-time="800">
//     <div>Swipe me!</div>
//   </swipeable-mixin>
class SwipeableMixin extends MixinBase(WebComponentBase) {
  static get observedAttributes() {
    return ["min-swipe-distance", "max-swipe-time"];
  }

  constructor() {
    super();
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._touchEndX = 0;
    this._touchEndY = 0;
    this._touchStartTime = 0;
    this._minSwipeDistance = 30;
    this._maxSwipeTime = 800;

    // simple shadow that just renders children "as-is"
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>:host{display:contents}</style><slot></slot>`;
  }

  // Private utility functions
  _validateDistance(distance) {
    const num = parseInt(distance);
    return !isNaN(num) && num > 0;
  }

  _validateTime(time) {
    const num = parseInt(time);
    return !isNaN(num) && num > 0;
  }

  _getTouchCoordinates(event) {
    if (event.touches && event.touches.length > 0) {
      const touch = event.touches[0] || event.changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    } else {
      return { x: event.clientX, y: event.clientY };
    }
  }

  _calculateSwipeDistance() {
    const deltaX = this._touchEndX - this._touchStartX;
    const deltaY = this._touchEndY - this._touchStartY;
    return {
      deltaX,
      deltaY,
      distance: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
    };
  }

  _calculateSwipeTime() {
    return Date.now() - this._touchStartTime;
  }

  _determineSwipeDirection(deltaX, deltaY) {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (absX > absY) {
      return deltaX > 0 ? "right" : "left";
    } else {
      return deltaY > 0 ? "down" : "up";
    }
  }

  _isValidSwipe(distance, time) {
    return distance >= this._minSwipeDistance && time <= this._maxSwipeTime;
  }

  _handleTouchStart = (event) => {
    const coords = this._getTouchCoordinates(event);
    this._touchStartX = coords.x;
    this._touchStartY = coords.y;
    this._touchStartTime = Date.now();
  };

  _handleTouchEnd = (event) => {
    const coords = this._getTouchCoordinates(event);
    this._touchEndX = coords.x;
    this._touchEndY = coords.y;
    const { deltaX, deltaY, distance } = this._calculateSwipeDistance();
    const time = this._calculateSwipeTime();
    if (this._isValidSwipe(distance, time)) {
      const direction = this._determineSwipeDirection(deltaX, deltaY);
      this.onSwipe(direction, { deltaX, deltaY, distance, time });
    }
  };

  _handleMouseStart = (event) => {
    const coords = this._getTouchCoordinates(event);
    this._touchStartX = coords.x;
    this._touchStartY = coords.y;
    this._touchStartTime = Date.now();
  };

  _handleMouseEnd = (event) => {
    const coords = this._getTouchCoordinates(event);
    this._touchEndX = coords.x;
    this._touchEndY = coords.y;
    const { deltaX, deltaY, distance } = this._calculateSwipeDistance();
    const time = this._calculateSwipeTime();
    if (this._isValidSwipe(distance, time)) {
      const direction = this._determineSwipeDirection(deltaX, deltaY);
      this.onSwipe(direction, { deltaX, deltaY, distance, time });
    }
  };

  // Public API
  setMinSwipeDistance(distance) {
    if (this._validateDistance(distance)) {
      this._minSwipeDistance = parseInt(distance);
    }
  }

  setMaxSwipeTime(time) {
    if (this._validateTime(time)) {
      this._maxSwipeTime = parseInt(time);
    }
  }

  onSwipe(direction, details) {
    // Default implementation: dispatch a custom event
    this.dispatchEvent(new CustomEvent("swipe", {
      detail: { direction, ...details },
      bubbles: true,
      composed: true,
    }));
  }

  connectedCallback() {
    if (super.connectedCallback) super.connectedCallback();
    // Set initial attributes
    const distance = this.getAttribute("min-swipe-distance");
    if (this._validateDistance(distance)) {
      this._minSwipeDistance = parseInt(distance);
    }
    const time = this.getAttribute("max-swipe-time");
    if (this._validateTime(time)) {
      this._maxSwipeTime = parseInt(time);
    }
    // Touch events for mobile
    this.addEventListener("touchstart", this._handleTouchStart);
    this.addEventListener("touchend", this._handleTouchEnd);
    // Mouse events for desktop
    this.addEventListener("mousedown", this._handleMouseStart);
    this.addEventListener("mouseup", this._handleMouseEnd);
    this.addEventListener("mouseleave", this._handleMouseEnd);
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) super.disconnectedCallback();
    this.removeEventListener("touchstart", this._handleTouchStart);
    this.removeEventListener("touchend", this._handleTouchEnd);
    this.removeEventListener("mousedown", this._handleMouseStart);
    this.removeEventListener("mouseup", this._handleMouseEnd);
    this.removeEventListener("mouseleave", this._handleMouseEnd);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (super.attributeChangedCallback) super.attributeChangedCallback(name, oldValue, newValue);
    if (name === "min-swipe-distance" && this._validateDistance(newValue)) {
      this._minSwipeDistance = parseInt(newValue);
    } else if (name === "max-swipe-time" && this._validateTime(newValue)) {
      this._maxSwipeTime = parseInt(newValue);
    }
  }
}

customElements.define('swipeable-mixin', SwipeableMixin);

export { SwipeableMixin };
