// Shared pointer coordination for mixins
// Manages pointer captures and ensures event redispatching

class PointerCoordinator {
  static _capturedPointers = new Map(); // pointerId -> element
  static _redispatchedEvents = new WeakSet(); // Track redispatched events to prevent loops
  static _scrollPreventionEnabled = false; // Track if we're preventing scrolling
  
  /**
   * Attempt to capture a pointer for an element
   * @param {HTMLElement} element - The element trying to capture
   * @param {number} pointerId - The pointer ID to capture
   * @returns {boolean} - True if successfully captured, false if already captured by another element
   */
  static capturePointer(element, pointerId) {
    // Check if already captured by another element
    const currentCapturer = this._capturedPointers.get(pointerId);
    if (currentCapturer && currentCapturer !== element) {
      console.warn(`[PointerCoordinator] Pointer ${pointerId} already captured by ${currentCapturer.tagName}`);
      return false; // Failed to capture
    }
    
    try {
      element.setPointerCapture(pointerId);
      this._capturedPointers.set(pointerId, element);
      console.log(`[PointerCoordinator] Pointer ${pointerId} captured by ${element.tagName}`);
      
      // Prevent scrolling when we capture a pointer
      this._preventScrolling();
      
      return true; // Successfully captured
    } catch (err) {
      console.warn('[PointerCoordinator] setPointerCapture failed:', err);
      return false;
    }
  }
  
  /**
   * Release a pointer capture
   * @param {HTMLElement} element - The element releasing the capture
   * @param {number} pointerId - The pointer ID to release
   */
  static releasePointer(element, pointerId) {
    if (this._capturedPointers.get(pointerId) === element) {
      try {
        element.releasePointerCapture(pointerId);
        this._capturedPointers.delete(pointerId);
        console.log(`[PointerCoordinator] Pointer ${pointerId} released by ${element.tagName}`);
        
        // Re-enable scrolling if no more pointers are captured
        if (this._capturedPointers.size === 0) {
          this._allowScrolling();
        }
      } catch (err) {
        console.warn('[PointerCoordinator] releasePointerCapture failed:', err);
      }
    }
  }
  
  /**
   * Check if a pointer is currently captured
   * @param {number} pointerId - The pointer ID to check
   * @returns {boolean} - True if pointer is captured
   */
  static isPointerCaptured(pointerId) {
    return this._capturedPointers.has(pointerId);
  }
  
  /**
   * Get the element currently capturing a pointer
   * @param {number} pointerId - The pointer ID to check
   * @returns {HTMLElement|null} - The capturing element or null
   */
  static getCapturingElement(pointerId) {
    return this._capturedPointers.get(pointerId) || null;
  }
  
  /**
   * Check if an element has captured a specific pointer
   * @param {HTMLElement} element - The element to check
   * @param {number} pointerId - The pointer ID to check
   * @returns {boolean} - True if the element has captured the pointer
   */
  static hasPointerCapture(element, pointerId) {
    return this._capturedPointers.get(pointerId) === element;
  }
  
  /**
   * Check if an event has already been redispatched to prevent loops
   * @param {Event} event - The event to check
   * @returns {boolean} - True if event is already redispatched
   */
  static isRedispatchedEvent(event) {
    return this._redispatchedEvents.has(event);
  }
  
  /**
   * Mark an event as redispatched
   * @param {Event} event - The event to mark
   */
  static markAsRedispatched(event) {
    this._redispatchedEvents.add(event);
  }
  
  /**
   * Redispatch a pointer event from the capturing element
   * @param {HTMLElement} capturingElement - The element that captured the pointer
   * @param {PointerEvent} originalEvent - The original pointer event
   * @param {string} eventType - The type of event to redispatch
   */
  static redispatchPointerEvent(capturingElement, originalEvent, eventType = null) {
    // Don't redispatch if this is already a redispatched event
    if (this.isRedispatchedEvent(originalEvent)) {
      return;
    }
    
    // Create new event with same properties
    const redispatchedEvent = new PointerEvent(eventType || originalEvent.type, {
      pointerId: originalEvent.pointerId,
      clientX: originalEvent.clientX,
      clientY: originalEvent.clientY,
      screenX: originalEvent.screenX,
      screenY: originalEvent.screenY,
      pressure: originalEvent.pressure,
      tiltX: originalEvent.tiltX,
      tiltY: originalEvent.tiltY,
      width: originalEvent.width,
      height: originalEvent.height,
      bubbles: true,
      composed: true,
      cancelable: true
    });
    
    // Mark as redispatched to prevent loops
    this.markAsRedispatched(redispatchedEvent);
    
    // Dispatch from the capturing element
    capturingElement.dispatchEvent(redispatchedEvent);
    
    console.log(`[PointerCoordinator] Redispatched ${eventType || originalEvent.type} from ${capturingElement.tagName}`);
  }
  
  /**
   * Prevent page scrolling during gesture interactions
   */
  static _preventScrolling() {
    if (this._scrollPreventionEnabled) return; // Already preventing
    
    this._scrollPreventionEnabled = true;
    
    // Prevent touch scrolling
    const preventScroll = (e) => {
      // Only prevent if we have active captures
      if (this._capturedPointers.size > 0) {
        e.preventDefault();
      }
    };
    
    // Store the handler so we can remove it later
    this._scrollPreventionHandler = preventScroll;
    
    // Add listeners to prevent scrolling
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('wheel', preventScroll, { passive: false });
    
    console.log('[PointerCoordinator] Scroll prevention enabled');
  }
  
  /**
   * Re-enable page scrolling
   */
  static _allowScrolling() {
    if (!this._scrollPreventionEnabled) return; // Not preventing
    
    this._scrollPreventionEnabled = false;
    
    // Remove scroll prevention listeners
    if (this._scrollPreventionHandler) {
      document.removeEventListener('touchmove', this._scrollPreventionHandler);
      document.removeEventListener('wheel', this._scrollPreventionHandler);
      this._scrollPreventionHandler = null;
    }
    
    console.log('[PointerCoordinator] Scrolling re-enabled');
  }
  
  /**
   * Clean up all captures (useful for debugging or cleanup)
   */
  static clearAllCaptures() {
    this._capturedPointers.clear();
    this._redispatchedEvents = new WeakSet();
    this._allowScrolling(); // Re-enable scrolling
    console.log('[PointerCoordinator] All captures cleared');
  }
  
  /**
   * Check if scrolling should be prevented
   * @returns {boolean} - True if scrolling is currently prevented
   */
  static isScrollPrevented() {
    return this._scrollPreventionEnabled && this._capturedPointers.size > 0;
  }
  
  /**
   * Check if a gesture should be processed (for early gesture detection)
   * @param {number} deltaX - X distance from start
   * @param {number} deltaY - Y distance from start
   * @param {number} threshold - Minimum distance threshold
   * @returns {boolean} - True if gesture should be processed
   */
  static shouldProcessGesture(deltaX, deltaY, threshold = 10) {
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    return distance >= threshold;
  }
  
  /**
   * Set up early gesture detection for an element
   * @param {HTMLElement} element - The element to monitor
   * @param {number} threshold - Distance threshold for gesture detection
   * @param {Function} onGestureStart - Callback when gesture is detected
   */
  static setupEarlyGestureDetection(element, threshold, onGestureStart) {
    let startX = 0;
    let startY = 0;
    let isMonitoring = false;
    
    const handlePointerDown = (event) => {
      if (PointerCoordinator.isRedispatchedEvent(event)) return;
      
      startX = event.clientX;
      startY = event.clientY;
      isMonitoring = true;
    };
    
    const handlePointerMove = (event) => {
      if (!isMonitoring || PointerCoordinator.isRedispatchedEvent(event)) return;
      
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      
      if (this.shouldProcessGesture(deltaX, deltaY, threshold)) {
        isMonitoring = false;
        onGestureStart(event, { startX, startY, deltaX, deltaY });
      }
    };
    
    const handlePointerUp = () => {
      isMonitoring = false;
    };
    
    element.addEventListener('pointerdown', handlePointerDown);
    element.addEventListener('pointermove', handlePointerMove);
    element.addEventListener('pointerup', handlePointerUp);
    element.addEventListener('pointercancel', handlePointerUp);
    element.addEventListener('pointerleave', handlePointerUp);
    
    // Return cleanup function
    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerup', handlePointerUp);
      element.removeEventListener('pointercancel', handlePointerUp);
      element.removeEventListener('pointerleave', handlePointerUp);
    };
  }
  
  /**
   * Get debug info about current captures
   * @returns {Object} - Debug information
   */
  static getDebugInfo() {
    return {
      capturedPointers: Array.from(this._capturedPointers.entries()).map(([pointerId, element]) => ({
        pointerId,
        elementTag: element.tagName,
        elementId: element.id || 'no-id'
      })),
      totalCaptures: this._capturedPointers.size,
      scrollPreventionEnabled: this._scrollPreventionEnabled,
      isScrollPrevented: this.isScrollPrevented()
    };
  }
}

export { PointerCoordinator }; 