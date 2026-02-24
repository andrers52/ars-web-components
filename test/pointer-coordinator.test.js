/**
 * Tests for PointerCoordinator
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Import the module
import { PointerCoordinator } from '../mixins/common/pointer-coordinator.js';

describe('PointerCoordinator', () => {
  let mockElement;
  let mockElement2;

  beforeEach(() => {
    // Clear all captures before each test
    PointerCoordinator.clearAllCaptures();
    
    // Create mock elements with methods
    mockElement = {
      tagName: 'DIV-ONE',
      setPointerCapture: jest.fn(),
      releasePointerCapture: jest.fn(),
      dispatchEvent: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
    
    mockElement2 = {
      tagName: 'DIV-TWO',
      setPointerCapture: jest.fn(),
      releasePointerCapture: jest.fn(),
      dispatchEvent: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };
  });

  describe('capturePointer', () => {
    it('should successfully capture a pointer', () => {
      const result = PointerCoordinator.capturePointer(mockElement, 1);
      
      expect(result).toBe(true);
      expect(mockElement.setPointerCapture).toHaveBeenCalledWith(1);
    });

    it('should fail if pointer already captured by another element', () => {
      PointerCoordinator.capturePointer(mockElement, 1);
      
      const result = PointerCoordinator.capturePointer(mockElement2, 1);
      
      expect(result).toBe(false);
      expect(mockElement2.setPointerCapture).not.toHaveBeenCalled();
    });

    it('should allow same element to recapture', () => {
      PointerCoordinator.capturePointer(mockElement, 1);
      
      const result = PointerCoordinator.capturePointer(mockElement, 1);
      
      expect(result).toBe(true);
    });

    it('should handle setPointerCapture errors gracefully', () => {
      mockElement.setPointerCapture = jest.fn(() => {
        throw new Error('Capture failed');
      });
      
      const result = PointerCoordinator.capturePointer(mockElement, 1);
      
      expect(result).toBe(false);
    });
  });

  describe('releasePointer', () => {
    it('should release a captured pointer', () => {
      PointerCoordinator.capturePointer(mockElement, 1);
      
      PointerCoordinator.releasePointer(mockElement, 1);
      
      expect(mockElement.releasePointerCapture).toHaveBeenCalledWith(1);
    });

    it('should not release if not captured by this element', () => {
      PointerCoordinator.capturePointer(mockElement, 1);
      
      PointerCoordinator.releasePointer(mockElement2, 1);
      
      expect(mockElement2.releasePointerCapture).not.toHaveBeenCalled();
    });

    it('should handle releasePointerCapture errors gracefully', () => {
      PointerCoordinator.capturePointer(mockElement, 1);
      mockElement.releasePointerCapture = jest.fn(() => {
        throw new Error('Release failed');
      });
      
      // Should not throw
      expect(() => PointerCoordinator.releasePointer(mockElement, 1)).not.toThrow();
    });
  });

  describe('isPointerCaptured', () => {
    it('should return true if pointer is captured', () => {
      PointerCoordinator.capturePointer(mockElement, 1);
      
      expect(PointerCoordinator.isPointerCaptured(1)).toBe(true);
    });

    it('should return false if pointer is not captured', () => {
      expect(PointerCoordinator.isPointerCaptured(999)).toBe(false);
    });
  });

  describe('getCapturingElement', () => {
    it('should return the element capturing a pointer', () => {
      PointerCoordinator.capturePointer(mockElement, 1);
      
      expect(PointerCoordinator.getCapturingElement(1)).toBe(mockElement);
    });

    it('should return null if no element captures the pointer', () => {
      expect(PointerCoordinator.getCapturingElement(999)).toBeNull();
    });
  });

  describe('hasPointerCapture', () => {
    it('should return true if element has the capture', () => {
      PointerCoordinator.capturePointer(mockElement, 1);
      
      expect(PointerCoordinator.hasPointerCapture(mockElement, 1)).toBe(true);
    });

    it('should return false if element does not have the capture', () => {
      PointerCoordinator.capturePointer(mockElement, 1);
      
      expect(PointerCoordinator.hasPointerCapture(mockElement2, 1)).toBe(false);
    });
  });

  describe('isRedispatchedEvent', () => {
    it('should return false for new events', () => {
      const event = new PointerEvent('pointerdown');
      
      expect(PointerCoordinator.isRedispatchedEvent(event)).toBe(false);
    });

    it('should return true for marked events', () => {
      const event = new PointerEvent('pointerdown');
      PointerCoordinator.markAsRedispatched(event);
      
      expect(PointerCoordinator.isRedispatchedEvent(event)).toBe(true);
    });
  });

  describe('markAsRedispatched', () => {
    it('should mark an event as redispatched', () => {
      const event = new PointerEvent('pointerdown');
      
      PointerCoordinator.markAsRedispatched(event);
      
      expect(PointerCoordinator.isRedispatchedEvent(event)).toBe(true);
    });
  });

  describe('redispatchPointerEvent', () => {
    it('should not redispatch already redispatched events', () => {
      const originalEvent = new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100
      });
      PointerCoordinator.markAsRedispatched(originalEvent);
      
      PointerCoordinator.redispatchPointerEvent(mockElement, originalEvent);
      
      expect(mockElement.dispatchEvent).not.toHaveBeenCalled();
    });

    it('should create and dispatch a new event with same properties', () => {
      const originalEvent = new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 200,
        bubbles: false
      });
      
      PointerCoordinator.redispatchPointerEvent(mockElement, originalEvent);
      
      expect(mockElement.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('clearAllCaptures', () => {
    it('should clear all captures', () => {
      PointerCoordinator.capturePointer(mockElement, 1);
      PointerCoordinator.capturePointer(mockElement2, 2);
      
      PointerCoordinator.clearAllCaptures();
      
      expect(PointerCoordinator.isPointerCaptured(1)).toBe(false);
      expect(PointerCoordinator.isPointerCaptured(2)).toBe(false);
    });
  });

  describe('shouldProcessGesture', () => {
    it('should return true if distance exceeds threshold', () => {
      const result = PointerCoordinator.shouldProcessGesture(10, 0, 10);
      
      expect(result).toBe(true);
    });

    it('should return false if distance is below threshold', () => {
      const result = PointerCoordinator.shouldProcessGesture(5, 0, 10);
      
      expect(result).toBe(false);
    });

    it('should calculate distance correctly', () => {
      // sqrt(6*6 + 8*8) = 10
      const result = PointerCoordinator.shouldProcessGesture(6, 8, 10);
      
      expect(result).toBe(true);
    });
  });

  describe('isScrollPrevented', () => {
    it('should return false when no pointers are captured', () => {
      expect(PointerCoordinator.isScrollPrevented()).toBe(false);
    });

    it('should return true when pointers are captured', () => {
      PointerCoordinator.capturePointer(mockElement, 1);
      
      expect(PointerCoordinator.isScrollPrevented()).toBe(true);
    });
  });

  describe('getDebugInfo', () => {
    it('should return debug information', () => {
      PointerCoordinator.capturePointer(mockElement, 1);
      
      const info = PointerCoordinator.getDebugInfo();
      
      expect(info.totalCaptures).toBe(1);
      expect(info.capturedPointers).toHaveLength(1);
      expect(info.capturedPointers[0].pointerId).toBe(1);
      expect(info.capturedPointers[0].elementTag).toBe('DIV-ONE');
    });
  });

  describe('setupEarlyGestureDetection', () => {
    it('should set up event listeners on element', () => {
      const onGestureStart = jest.fn();
      const el = document.createElement('div');
      
      const cleanup = PointerCoordinator.setupEarlyGestureDetection(
        el,
        10,
        onGestureStart
      );
      
      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('should return cleanup function that removes listeners', () => {
      const onGestureStart = jest.fn();
      const el = document.createElement('div');
      const removeSpy = jest.spyOn(el, 'removeEventListener');
      
      const cleanup = PointerCoordinator.setupEarlyGestureDetection(
        el,
        10,
        onGestureStart
      );
      
      cleanup();
      
      expect(removeSpy).toHaveBeenCalled();
    });
  });
});