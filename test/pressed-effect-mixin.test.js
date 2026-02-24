/**
 * Tests for PressedEffectMixin
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest, vi } from '@jest/globals';

// Import the module
import { PressedEffectMixin } from '../mixins/pressed-effect-mixin/pressed-effect-mixin.js';

describe('PressedEffectMixin', () => {
  let element;
  let childElement;

  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '';
    
    element = document.createElement('pressed-effect-mixin');
    childElement = document.createElement('button');
    childElement.style.backgroundColor = 'rgb(100, 100, 100)';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Static properties', () => {
    it('should have observedAttributes', () => {
      expect(PressedEffectMixin.observedAttributes).toContain('pressed-class');
    });
  });

  describe('Lifecycle', () => {
    it('should have connectedCallback', () => {
      expect(typeof element.connectedCallback).toBe('function');
    });

    it('should have disconnectedCallback', () => {
      expect(typeof element.disconnectedCallback).toBe('function');
    });

    it('should set up listeners when child is added', () => {
      document.body.appendChild(element);
      element.appendChild(childElement);
      
      jest.advanceTimersByTime(10);
      
      expect(element._target).toBeDefined();
    });
  });

  describe('Attribute handling', () => {
    it('should read pressed-class from attribute', () => {
      element.setAttribute('pressed-class', 'my-pressed');
      document.body.appendChild(element);
      element.appendChild(childElement);
      
      jest.advanceTimersByTime(10);
      
      expect(element._pressedClass).toBe('my-pressed');
    });

    it('should use default pressed class if not specified', () => {
      document.body.appendChild(element);
      element.appendChild(childElement);
      
      jest.advanceTimersByTime(10);
      
      expect(element._pressedClass).toBe('pressed');
    });
  });

  describe('Press functionality', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      element.appendChild(childElement);
      jest.advanceTimersByTime(10);
    });

    it('should add pressed class on mousedown', () => {
      const mouseDownEvent = new MouseEvent('mousedown', { button: 0 });
      childElement.dispatchEvent(mouseDownEvent);
      
      expect(childElement.classList.contains('pressed')).toBe(true);
    });

    it('should not add pressed class on right click', () => {
      const mouseDownEvent = new MouseEvent('mousedown', { button: 2 });
      childElement.dispatchEvent(mouseDownEvent);
      
      expect(childElement.classList.contains('pressed')).toBe(false);
    });

    it('should add pressed class on touchstart', () => {
      const touchStartEvent = new Event('touchstart');
      childElement.dispatchEvent(touchStartEvent);
      
      expect(childElement.classList.contains('pressed')).toBe(true);
    });

    it('should remove pressed class on mouseup', () => {
      const mouseDownEvent = new MouseEvent('mousedown', { button: 0 });
      childElement.dispatchEvent(mouseDownEvent);
      
      const mouseUpEvent = new Event('mouseup');
      childElement.dispatchEvent(mouseUpEvent);
      
      expect(childElement.classList.contains('pressed')).toBe(false);
    });

    it('should remove pressed class on mouseleave', () => {
      const mouseDownEvent = new MouseEvent('mousedown', { button: 0 });
      childElement.dispatchEvent(mouseDownEvent);
      
      const mouseLeaveEvent = new Event('mouseleave');
      childElement.dispatchEvent(mouseLeaveEvent);
      
      expect(childElement.classList.contains('pressed')).toBe(false);
    });

    it('should remove pressed class on touchend', () => {
      const touchStartEvent = new Event('touchstart');
      childElement.dispatchEvent(touchStartEvent);
      
      const touchEndEvent = new Event('touchend');
      childElement.dispatchEvent(touchEndEvent);
      
      expect(childElement.classList.contains('pressed')).toBe(false);
    });

    it('should remove pressed class on touchcancel', () => {
      const touchStartEvent = new Event('touchstart');
      childElement.dispatchEvent(touchStartEvent);
      
      const touchCancelEvent = new Event('touchcancel');
      childElement.dispatchEvent(touchCancelEvent);
      
      expect(childElement.classList.contains('pressed')).toBe(false);
    });
  });

  describe('Animation timing', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      element.appendChild(childElement);
      jest.advanceTimersByTime(10);
    });

    it('should auto-end press after animation time', () => {
      const mouseDownEvent = new MouseEvent('mousedown', { button: 0 });
      childElement.dispatchEvent(mouseDownEvent);
      
      expect(childElement.classList.contains('pressed')).toBe(true);
      
      // Advance past animation time (700ms + 50ms buffer)
      jest.advanceTimersByTime(800);
      
      expect(childElement.classList.contains('pressed')).toBe(false);
    });

    it('should clear timer on end press', () => {
      const mouseDownEvent = new MouseEvent('mousedown', { button: 0 });
      childElement.dispatchEvent(mouseDownEvent);
      
      const mouseUpEvent = new Event('mouseup');
      childElement.dispatchEvent(mouseUpEvent);
      
      expect(element._pressTimer).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should clear timer when _clearTimer is called', () => {
      // Set a timer manually
      element._pressTimer = setTimeout(() => {}, 1000);
      
      // Clear it
      element._clearTimer();
      
      expect(element._pressTimer).toBeNull();
    });
    
    it('should have _removeListeners method defined', () => {
      expect(typeof element._removeListeners).toBe('function');
    });
    
    it('should have _clearTimer method', () => {
      expect(typeof element._clearTimer).toBe('function');
    });
  });

  describe('Helper methods', () => {
    it('should have _addListeners method', () => {
      expect(typeof element._addListeners).toBe('function');
    });

    it('should have _removeListeners method', () => {
      expect(typeof element._removeListeners).toBe('function');
    });

    it('should have _startPress method', () => {
      expect(typeof element._startPress).toBe('function');
    });

    it('should have _endPress method', () => {
      expect(typeof element._endPress).toBe('function');
    });
  });
});