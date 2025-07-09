import WebComponentBase from '../../components/web-component-base/web-component-base.js';
import { MixinBase } from '../common/mixin-base.js';
import { PointerCoordinator } from '../common/pointer-coordinator.js';

// DraggableMixin - declarative web component for drag gesture detection
// Usage:
//   <draggable-mixin>
//     <div>Drag me!</div>
//   </draggable-mixin>
class DraggableMixin extends MixinBase(WebComponentBase) {
  static get observedAttributes() {
    return ["drag-threshold"];
  }

  constructor() {
    super();
    this._dragStartX = 0;
    this._dragStartY = 0;
    this._dragThreshold = 5; // Minimum distance to start dragging
    this._isDragging = false;
    this._dragDistance = 0;

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
  _validateThreshold(threshold) {
    const num = parseInt(threshold);
    return !isNaN(num) && num >= 0;
  }

  _calculateDragDistance(currentX, currentY) {
    const deltaX = currentX - this._dragStartX;
    const deltaY = currentY - this._dragStartY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  _determineDragDirection(deltaX, deltaY) {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (absX > absY) {
      return deltaX > 0 ? "right" : "left";
    } else {
      return deltaY > 0 ? "down" : "up";
    }
  }

  // Public API
  setDragThreshold(threshold) {
    if (this._validateThreshold(threshold)) {
      this._dragThreshold = parseInt(threshold);
    }
  }

  onDragStart(details) {
    this.dispatchEvent(new CustomEvent("dragstart", {
      detail: details,
      bubbles: true,
      composed: true,
    }));
    console.log('[draggable-mixin] CustomEvent "dragstart" dispatched', details);
  }

  onDragMove(details) {
    this.dispatchEvent(new CustomEvent("dragmove", {
      detail: details,
      bubbles: true,
      composed: true,
    }));
    console.log('[draggable-mixin] CustomEvent "dragmove" dispatched', details);
  }

  onDragEnd(details) {
    this.dispatchEvent(new CustomEvent("dragend", {
      detail: details,
      bubbles: true,
      composed: true,
    }));
    console.log('[draggable-mixin] CustomEvent "dragend" dispatched', details);
  }

  connectedCallback() {
    if (super.connectedCallback) super.connectedCallback();
    
    // Set initial attributes
    const threshold = this.getAttribute("drag-threshold");
    if (this._validateThreshold(threshold)) {
      this._dragThreshold = parseInt(threshold);
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
    if (name === "drag-threshold" && this._validateThreshold(newValue)) {
      this._dragThreshold = parseInt(newValue);
    }
  }

  _handlePointerDown = (event) => {
    // Skip if this is a redispatched event
    if (PointerCoordinator.isRedispatchedEvent(event)) {
      return;
    }
    
    console.log('[draggable-mixin] _handlePointerDown called', {
      pointerId: event.pointerId,
      pointerDown: this._pointerDown,
      event
    });
    
    if (this._pointerDown) return; // Only track one pointer
    
    // Try to capture the pointer
    if (!PointerCoordinator.capturePointer(this, event.pointerId)) {
      console.log('[draggable-mixin] Failed to capture pointer, will listen for redispatched events');
      return; // Another mixin captured it, we'll listen for redispatched events
    }
    
    this._pointerDown = true;
    this._pointerId = event.pointerId;
    this._dragStartX = event.clientX;
    this._dragStartY = event.clientY;
    this._isDragging = false;
    this._dragDistance = 0;
    
    // Redispatch the event so other mixins can receive it
    PointerCoordinator.redispatchPointerEvent(this, event);
    
    console.log('[draggable-mixin] Drag started at:', { x: this._dragStartX, y: this._dragStartY });
  };

  _handlePointerMove = (event) => {
    // Skip if this is a redispatched event
    if (PointerCoordinator.isRedispatchedEvent(event)) {
      return;
    }
    
    console.log('[draggable-mixin] _handlePointerMove called', {
      pointerId: event.pointerId,
      trackingPointerId: this._pointerId,
      pointerDown: this._pointerDown,
      event
    });
    
    if (!this._pointerDown || event.pointerId !== this._pointerId) return;
    
    // Redispatch the event so other mixins can receive it
    PointerCoordinator.redispatchPointerEvent(this, event);
    
    const currentDistance = this._calculateDragDistance(event.clientX, event.clientY);
    const deltaX = event.clientX - this._dragStartX;
    const deltaY = event.clientY - this._dragStartY;
    
    // Only prevent scrolling if we're actually processing a gesture
    if (PointerCoordinator.shouldProcessGesture(deltaX, deltaY, this._dragThreshold)) {
      event.preventDefault();
    }
    
    // Check if we should start dragging
    if (!this._isDragging && currentDistance >= this._dragThreshold) {
      this._isDragging = true;
      this.onDragStart({
        startX: this._dragStartX,
        startY: this._dragStartY,
        currentX: event.clientX,
        currentY: event.clientY,
        deltaX,
        deltaY,
        distance: currentDistance,
        direction: this._determineDragDirection(deltaX, deltaY)
      });
    }
    
    // If we're dragging, emit drag move events
    if (this._isDragging) {
      this._dragDistance = currentDistance;
      this.onDragMove({
        startX: this._dragStartX,
        startY: this._dragStartY,
        currentX: event.clientX,
        currentY: event.clientY,
        deltaX,
        deltaY,
        distance: currentDistance,
        direction: this._determineDragDirection(deltaX, deltaY),
        isDragging: true
      });
    }
  };

  _handlePointerUp = (event) => {
    // Skip if this is a redispatched event
    if (PointerCoordinator.isRedispatchedEvent(event)) {
      return;
    }
    
    console.log('[draggable-mixin] _handlePointerUp called', {
      pointerId: event.pointerId,
      trackingPointerId: this._pointerId,
      pointerDown: this._pointerDown,
      event
    });
    
    if (!this._pointerDown || event.pointerId !== this._pointerId) return;
    
    // Redispatch the event so other mixins can receive it
    PointerCoordinator.redispatchPointerEvent(this, event);
    
    this._pointerDown = false;
    PointerCoordinator.releasePointer(this, this._pointerId);
    
    const finalDistance = this._calculateDragDistance(event.clientX, event.clientY);
    const deltaX = event.clientX - this._dragStartX;
    const deltaY = event.clientY - this._dragStartY;
    
    // If we were dragging, emit drag end event
    if (this._isDragging) {
      this.onDragEnd({
        startX: this._dragStartX,
        startY: this._dragStartY,
        endX: event.clientX,
        endY: event.clientY,
        deltaX,
        deltaY,
        distance: finalDistance,
        direction: this._determineDragDirection(deltaX, deltaY),
        wasDragging: true
      });
    }
    
    // Reset state
    this._isDragging = false;
    this._dragDistance = 0;
    
    console.log('[draggable-mixin] Drag ended:', {
      wasDragging: this._isDragging,
      finalDistance,
      direction: this._determineDragDirection(deltaX, deltaY)
    });
  };
}

customElements.define('draggable-mixin', DraggableMixin);

export { DraggableMixin }; 