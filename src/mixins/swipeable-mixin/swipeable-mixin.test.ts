/**
 * Tests for SwipeableMixin
 * @vi-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, vi } from 'vitest';

// Import the module
import { SwipeableMixin } from './swipeable-mixin.js';
import { PointerCoordinator } from '../common/pointer-coordinator.js';

describe('SwipeableMixin', () => {
  let element;

  beforeEach(() => {
    vi.useFakeTimers();
    PointerCoordinator.clearAllCaptures();
    document.body.innerHTML = '';
    
    element = document.createElement('swipeable-mixin');
  });

  afterEach(() => {
    vi.useRealTimers();
    PointerCoordinator.clearAllCaptures();
  });

  describe('Static properties', () => {
    it('should have observedAttributes', () => {
      expect(SwipeableMixin.observedAttributes).toContain('min-swipe-distance');
      expect(SwipeableMixin.observedAttributes).toContain('max-swipe-time');
    });
  });

  describe('Initialization', () => {
    it('should create shadow DOM', () => {
      expect(element.shadowRoot).toBeDefined();
    });

    it('should have default min swipe distance', () => {
      expect(element._minSwipeDistance).toBe(30);
    });

    it('should have default max swipe time', () => {
      expect(element._maxSwipeTime).toBe(800);
    });
  });

  describe('Attribute handling', () => {
    it('should read min-swipe-distance from attribute', () => {
      element.setAttribute('min-swipe-distance', '50');
      document.body.appendChild(element);
      
      expect(element._minSwipeDistance).toBe(50);
    });

    it('should read max-swipe-time from attribute', () => {
      element.setAttribute('max-swipe-time', '500');
      document.body.appendChild(element);
      
      expect(element._maxSwipeTime).toBe(500);
    });

    it('should ignore invalid min-swipe-distance', () => {
      element.setAttribute('min-swipe-distance', 'invalid');
      document.body.appendChild(element);
      
      expect(element._minSwipeDistance).toBe(30); // default
    });
  });

  describe('Validation methods', () => {
    it('should validate distance correctly', () => {
      expect(element._validateDistance(50)).toBe(true);
      expect(element._validateDistance(0)).toBe(false);
      expect(element._validateDistance(-10)).toBe(false);
      expect(element._validateDistance('invalid')).toBe(false);
    });

    it('should validate time correctly', () => {
      expect(element._validateTime(500)).toBe(true);
      expect(element._validateTime(0)).toBe(false);
      expect(element._validateTime(-10)).toBe(false);
      expect(element._validateTime('invalid')).toBe(false);
    });
  });

  describe('Swipe distance calculation', () => {
    it('should calculate swipe distance correctly', () => {
      element._touchStartX = 0;
      element._touchStartY = 0;
      element._touchEndX = 30;
      element._touchEndY = 40;
      
      const result = element._calculateSwipeDistance();
      
      expect(result.deltaX).toBe(30);
      expect(result.deltaY).toBe(40);
      expect(result.distance).toBe(50); // sqrt(30^2 + 40^2) = 50
    });
  });

  describe('Swipe direction detection', () => {
    it('should detect right swipe', () => {
      const direction = element._determineSwipeDirection(50, 0);
      expect(direction).toBe('right');
    });

    it('should detect left swipe', () => {
      const direction = element._determineSwipeDirection(-50, 0);
      expect(direction).toBe('left');
    });

    it('should detect down swipe', () => {
      const direction = element._determineSwipeDirection(0, 50);
      expect(direction).toBe('down');
    });

    it('should detect up swipe', () => {
      const direction = element._determineSwipeDirection(0, -50);
      expect(direction).toBe('up');
    });

    it('should prefer horizontal on diagonal', () => {
      const direction = element._determineSwipeDirection(50, 30);
      expect(direction).toBe('right');
    });
  });

  describe('Swipe validation', () => {
    it('should validate swipe within thresholds', () => {
      element._minSwipeDistance = 30;
      element._maxSwipeTime = 800;
      
      expect(element._isValidSwipe(50, 500)).toBe(true);
    });

    it('should reject swipe below distance threshold', () => {
      element._minSwipeDistance = 30;
      element._maxSwipeTime = 800;
      
      expect(element._isValidSwipe(20, 500)).toBe(false);
    });

    it('should reject swipe above time threshold', () => {
      element._minSwipeDistance = 30;
      element._maxSwipeTime = 800;
      
      expect(element._isValidSwipe(50, 1000)).toBe(false);
    });
  });

  describe('Public API', () => {
    it('should have setMinSwipeDistance method', () => {
      expect(typeof element.setMinSwipeDistance).toBe('function');
    });

    it('should have setMaxSwipeTime method', () => {
      expect(typeof element.setMaxSwipeTime).toBe('function');
    });

    it('should have onSwipe method', () => {
      expect(typeof element.onSwipe).toBe('function');
    });

    it('should dispatch swipe event', () => {
      const eventHandler = vi.fn();
      element.addEventListener('swipe', eventHandler);
      
      element.onSwipe('right', { deltaX: 50, deltaY: 0, distance: 50, time: 200 });
      
      expect(eventHandler).toHaveBeenCalled();
      const event = eventHandler.mock.calls[0][0];
      expect(event.detail.direction).toBe('right');
    });
  });

  describe('Lifecycle', () => {
    it('should have connectedCallback', () => {
      expect(typeof element.connectedCallback).toBe('function');
    });

    it('should have disconnectedCallback', () => {
      expect(typeof element.disconnectedCallback).toBe('function');
    });

    it('should add event listeners on connect', () => {
      const addSpy = vi.spyOn(element, 'addEventListener');
      
      element.connectedCallback();
      
      expect(addSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    });

    it('should remove event listeners on disconnect', () => {
      const removeSpy = vi.spyOn(element, 'removeEventListener');
      
      element.connectedCallback();
      element.disconnectedCallback();
      
      expect(removeSpy).toHaveBeenCalled();
    });
  });

  describe('Touch coordinates', () => {
    it('should get coordinates from mouse event', () => {
      const event = { clientX: 100, clientY: 200 };
      
      const coords = element._getTouchCoordinates(event);
      
      expect(coords.x).toBe(100);
      expect(coords.y).toBe(200);
    });

    it('should get coordinates from touch event', () => {
      const event = {
        touches: [{ clientX: 150, clientY: 250 }]
      };
      
      const coords = element._getTouchCoordinates(event);
      
      expect(coords.x).toBe(150);
      expect(coords.y).toBe(250);
    });

    it('should get coordinates from changed touches', () => {
      const event = {
        touches: [],
        changedTouches: [{ clientX: 175, clientY: 275 }]
      };
      
      const coords = element._getTouchCoordinates(event);
      
      expect(coords.x).toBe(175);
      expect(coords.y).toBe(275);
    });
  });

  describe('Pointer event handlers', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      vi.advanceTimersByTime(10);
    });

    it('should capture pointer on pointerdown', () => {
      const pointerDownEvent = new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true
      });
      
      element.setPointerCapture = vi.fn();
      element.dispatchEvent(pointerDownEvent);
      
      expect(element._pointerDown).toBe(true);
      expect(element._pointerId).toBe(1);
    });

    it('should not process second pointer while first is active', () => {
      element._pointerDown = true;
      element._pointerId = 1;
      
      const pointerDownEvent = new PointerEvent('pointerdown', {
        pointerId: 2,
        clientX: 100,
        clientY: 100,
        bubbles: true
      });
      
      element.dispatchEvent(pointerDownEvent);
      
      // Should still be tracking first pointer
      expect(element._pointerId).toBe(1);
    });
  });
});
