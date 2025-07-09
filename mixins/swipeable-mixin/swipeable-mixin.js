import WebComponentBase from '../../components/web-component-base/web-component-base.js';
import { MixinBase } from '../common/mixin-base.js';
import { PointerCoordinator } from '../common/pointer-coordinator.js';

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
      <style>
        :host {
          display: flex;
          width: 100%;
          height: 100%;
        }
      </style>
      <slot></slot>`;

    // Pointer event state
    this._pointerDown = false;
    this._pointerId = null;
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
      // Touch start or move
      const touch = event.touches[0];
      return { x: touch.clientX, y: touch.clientY };
    } else if (event.changedTouches && event.changedTouches.length > 0) {
      // Touch end
      const touch = event.changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    } else {
      // Mouse event fallback
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
    event.preventDefault();
    const coords = this._getTouchCoordinates(event);
    this._touchStartX = coords.x;
    this._touchStartY = coords.y;
    this._touchStartTime = Date.now();
    console.log('Touch start:', this._touchStartX, this._touchStartY);
  };

  _handleTouchMove = (event) => {
    event.preventDefault();
    // Prevent scrolling during swipe
  };

  _handleTouchEnd = (event) => {
    event.preventDefault();
    console.log('_handleTouchEnd');
    const coords = this._getTouchCoordinates(event);
    this._touchEndX = coords.x;
    this._touchEndY = coords.y;
    const { deltaX, deltaY, distance } = this._calculateSwipeDistance();
    const time = this._calculateSwipeTime();
    console.log('Touch start:', this._touchStartX, this._touchStartY);
    console.log('Touch end:', this._touchEndX, this._touchEndY);
    console.log('Delta X:', deltaX, 'Delta Y:', deltaY, 'Distance:', distance);
    console.log('Time:', time, 'Min distance:', this._minSwipeDistance, 'Max time:', this._maxSwipeTime);
    console.log('this._isValidSwipe(distance, time)', this._isValidSwipe(distance, time));
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
    console.log('_handleMouseEnd');
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
    // Always dispatch from the host element, not from shadowRoot or a child
    this.dispatchEvent(new CustomEvent("swipe", {
      detail: { direction, ...details },
      bubbles: true,
      composed: true,
    }));
    // Optionally, also log for debugging
    console.log('[swipeable-mixin] CustomEvent "swipe" dispatched from host', direction, details);
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
    // Attach pointer events to the host element
    this.addEventListener("pointerdown", this._handlePointerDown);
    this.addEventListener("pointermove", this._handlePointerMove);
    this.addEventListener("pointerup", this._handlePointerUp);
    this.addEventListener("pointercancel", this._handlePointerUp);
    this.addEventListener("pointerleave", this._handlePointerUp);
  }

  disconnectedCallback() {
    if (super.disconnectedCallback) super.disconnectedCallback();
    this.removeEventListener("pointerdown", this._handlePointerDown);
    this.removeEventListener("pointermove", this._handlePointerMove);
    this.removeEventListener("pointerup", this._handlePointerUp);
    this.removeEventListener("pointercancel", this._handlePointerUp);
    this.removeEventListener("pointerleave", this._handlePointerUp);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (super.attributeChangedCallback) super.attributeChangedCallback(name, oldValue, newValue);
    if (name === "min-swipe-distance" && this._validateDistance(newValue)) {
      this._minSwipeDistance = parseInt(newValue);
    } else if (name === "max-swipe-time" && this._validateTime(newValue)) {
      this._maxSwipeTime = parseInt(newValue);
    }
  }

  _handlePointerDown = (event) => {
    // Skip if this is a redispatched event
    if (PointerCoordinator.isRedispatchedEvent(event)) {
      return;
    }
    
    console.log('[swipeable-mixin] _handlePointerDown called', {
      pointerId: event.pointerId,
      pointerDown: this._pointerDown,
      event
    });
    
    if (this._pointerDown) return; // Only track one pointer
    
    // Try to capture the pointer
    if (!PointerCoordinator.capturePointer(this, event.pointerId)) {
      console.log('[swipeable-mixin] Failed to capture pointer, will listen for redispatched events');
      return; // Another mixin captured it, we'll listen for redispatched events
    }
    
    this._pointerDown = true;
    this._pointerId = event.pointerId;
    this._touchStartX = event.clientX;
    this._touchStartY = event.clientY;
    this._touchStartTime = Date.now();
    
    // Redispatch the event so other mixins can receive it
    PointerCoordinator.redispatchPointerEvent(this, event);
    
    // Debug: Log bounding rect and start coordinates
    const rect = this.getBoundingClientRect();
    console.log('[swipeable-mixin] Bounding rect:', rect);
    console.log('[swipeable-mixin] Start coordinates:', { x: this._touchStartX, y: this._touchStartY });
  };

  _handlePointerMove = (event) => {
    // Skip if this is a redispatched event
    if (PointerCoordinator.isRedispatchedEvent(event)) {
      return;
    }
    
    console.log('[swipeable-mixin] _handlePointerMove called', {
      pointerId: event.pointerId,
      trackingPointerId: this._pointerId,
      pointerDown: this._pointerDown,
      event
    });
    
    if (!this._pointerDown || event.pointerId !== this._pointerId) return;
    console.log('[swipeable-mixin] pointermove', event.type, event.pointerId, event.clientX, event.clientY);
    
    // Redispatch the event so other mixins can receive it
    PointerCoordinator.redispatchPointerEvent(this, event);
    
    // Calculate current drag distance and direction
    const deltaX = event.clientX - this._touchStartX;
    const deltaY = event.clientY - this._touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Only prevent scrolling if we're actually processing a gesture
    if (PointerCoordinator.shouldProcessGesture(deltaX, deltaY, this._minSwipeDistance / 2)) {
      event.preventDefault();
    }
    
    // Emit drag event for real-time feedback
    this.dispatchEvent(new CustomEvent("drag", {
      detail: { 
        deltaX, 
        deltaY, 
        distance,
        direction: Math.abs(deltaX) > Math.abs(deltaY)
          ? (deltaX > 0 ? "right" : "left")
          : (deltaY > 0 ? "down" : "up")
      },
      bubbles: true,
      composed: true,
    }));
  };

  _handlePointerUp = (event) => {
    // Skip if this is a redispatched event
    if (PointerCoordinator.isRedispatchedEvent(event)) {
      return;
    }
    
    console.log('[swipeable-mixin] _handlePointerUp called', {
      pointerId: event.pointerId,
      trackingPointerId: this._pointerId,
      pointerDown: this._pointerDown,
      event
    });
    
    if (!this._pointerDown || event.pointerId !== this._pointerId) return;
    console.log('[swipeable-mixin] pointerup', event.type, event.pointerId, event.clientX, event.clientY);
    
    // Redispatch the event so other mixins can receive it
    PointerCoordinator.redispatchPointerEvent(this, event);
    
    this._pointerDown = false;
    PointerCoordinator.releasePointer(this, this._pointerId);
    
    this._touchEndX = event.clientX;
    this._touchEndY = event.clientY;
    const deltaX = this._touchEndX - this._touchStartX;
    const deltaY = this._touchEndY - this._touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const time = Date.now() - this._touchStartTime;
    
    // Debug: Log detailed pointer coordinates and distance calculation
    console.log('[swipeable-mixin] pointerup detailed:', {
      start: { x: this._touchStartX, y: this._touchStartY },
      end: { x: event.clientX, y: event.clientY },
      deltaX,
      deltaY,
      distance,
      minSwipeDistance: this._minSwipeDistance,
      time,
      maxSwipeTime: this._maxSwipeTime,
      isValidSwipe: distance >= this._minSwipeDistance && time <= this._maxSwipeTime
    });
    
    if (distance >= this._minSwipeDistance && time <= this._maxSwipeTime) {
      const direction = Math.abs(deltaX) > Math.abs(deltaY)
        ? (deltaX > 0 ? "right" : "left")
        : (deltaY > 0 ? "down" : "up");
      console.log('[swipeable-mixin] Detected swipe', { direction, deltaX, deltaY, distance, time });
      this.onSwipe(direction, { deltaX, deltaY, distance, time });
    }
  };
}

customElements.define('swipeable-mixin', SwipeableMixin);

export { SwipeableMixin };
