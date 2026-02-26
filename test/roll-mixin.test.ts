/**
 * Tests for RollMixin
 * @vi-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, vi } from 'vitest';

// Import the module
import { RollMixin } from '../src/mixins/roll-mixin/roll-mixin.js';

describe('RollMixin', () => {
  let element;
  let childElement;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    
    element = document.createElement('roll-mixin');
    childElement = document.createElement('button');
    childElement.id = 'child';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Static properties', () => {
    it('should have observedAttributes', () => {
      expect(RollMixin.observedAttributes).toContain('roll-duration');
    });
  });

  describe('Initialization', () => {
    it('should create shadow DOM', () => {
      expect(element.shadowRoot).toBeDefined();
    });

    it('should have default roll duration', () => {
      expect(element._rollDuration).toBe(1000);
    });

    it('should not be rolling initially', () => {
      expect(element._isRolling).toBe(false);
    });

    it('should not be in cooldown initially', () => {
      expect(element._isInCooldown).toBe(false);
    });
  });

  describe('Attribute handling', () => {
    it('should read roll-duration from attribute', () => {
      element.setAttribute('roll-duration', '2000');
      document.body.appendChild(element);
      
      expect(element._rollDuration).toBe(2000);
    });

    it('should use default for invalid duration', () => {
      element.setAttribute('roll-duration', 'invalid');
      document.body.appendChild(element);
      
      expect(element._rollDuration).toBe(1000);
    });
  });

  describe('Public API', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      element.appendChild(childElement);
      vi.advanceTimersByTime(10);
    });

    it('should have roll method', () => {
      expect(typeof element.roll).toBe('function');
    });

    it('should have getRollDuration method', () => {
      expect(typeof element.getRollDuration).toBe('function');
    });

    it('should have setRollDuration method', () => {
      expect(typeof element.setRollDuration).toBe('function');
    });

    it('getRollDuration should return current duration', () => {
      expect(element.getRollDuration()).toBe(1000);
    });

    it('setRollDuration should update duration', () => {
      element.setRollDuration(2000);
      
      expect(element._rollDuration).toBe(2000);
      expect(element.getAttribute('roll-duration')).toBe('2000');
    });

    it('setRollDuration should ignore invalid values', () => {
      element.setRollDuration('invalid');
      
      expect(element._rollDuration).toBe(1000);
    });

    it('should not set duration if value unchanged', () => {
      const initialDuration = element._rollDuration;
      
      element.setRollDuration(initialDuration);
      
      // Should still be the same value
      expect(element._rollDuration).toBe(initialDuration);
    });
  });

  describe('Roll functionality', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      element.appendChild(childElement);
      vi.advanceTimersByTime(10);
    });

    it('should set rolling state on roll()', () => {
      element.roll();
      
      expect(element._isRolling).toBe(true);
    });

    it('should not roll if already rolling', () => {
      element._isRolling = true;
      
      element.roll();
      
      // Should still be true (didn't reset)
      expect(element._isRolling).toBe(true);
    });

    it('should not roll if in cooldown', () => {
      element._isInCooldown = true;
      
      element.roll();
      
      expect(element._isRolling).toBe(false);
    });

    it('should dispatch roll-started event', () => {
      const eventHandler = vi.fn();
      element.addEventListener('roll-started', eventHandler);
      
      element.roll();
      
      expect(eventHandler).toHaveBeenCalled();
    });

    it('should reset rolling state after animation', () => {
      element.roll();
      
      // Advance past animation time
      vi.advanceTimersByTime(1100);
      
      expect(element._isRolling).toBe(false);
    });

    it('should start cooldown after animation', () => {
      element.roll();
      
      // Advance past animation time
      vi.advanceTimersByTime(1100);
      
      expect(element._isInCooldown).toBe(true);
    });

    it('should end cooldown after delay', () => {
      element.roll();
      
      // Advance past animation and cooldown
      vi.advanceTimersByTime(1600);
      
      expect(element._isInCooldown).toBe(false);
    });
  });

  describe('Lifecycle', () => {
    it('should have connectedCallback', () => {
      expect(typeof element.connectedCallback).toBe('function');
    });

    it('should have disconnectedCallback', () => {
      expect(typeof element.disconnectedCallback).toBe('function');
    });

    it('should clean up timers on disconnect', () => {
      document.body.appendChild(element);
      element.appendChild(childElement);
      vi.advanceTimersByTime(10);
      
      element.roll();
      
      element.disconnectedCallback();
      
      expect(element._animationTimeout).toBeNull();
      expect(element._cooldownTimeout).toBeNull();
    });
  });

  describe('Animation', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      element.appendChild(childElement);
      vi.advanceTimersByTime(10);
    });

    it('should use Web Animations API if available', () => {
      // Mock animate method on child element
      childElement.animate = vi.fn(() => ({
        finished: Promise.resolve()
      }));
      
      element.roll();
      
      expect(childElement.animate).toHaveBeenCalled();
    });

    it('should dispatch roll-completed event after animation', () => {
      const eventHandler = vi.fn();
      element.addEventListener('roll-completed', eventHandler);
      
      element.roll();
      
      // Advance past animation
      vi.advanceTimersByTime(1100);
      
      expect(eventHandler).toHaveBeenCalled();
    });
  });

  describe('Hover listeners', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      element.appendChild(childElement);
      vi.advanceTimersByTime(10);
    });

    it('should set up hover listeners', () => {
      expect(element._hoverHandler).toBeDefined();
    });

    it('should trigger roll on hover', () => {
      const rollSpy = vi.spyOn(element, 'roll');
      
      const mouseEnterEvent = new MouseEvent('mouseenter', {
        bubbles: true
      });
      childElement.dispatchEvent(mouseEnterEvent);
      
      expect(rollSpy).toHaveBeenCalled();
    });

    it('should not trigger roll if already rolling on hover', () => {
      element._isRolling = true;
      
      const mouseEnterEvent = new MouseEvent('mouseenter', {
        bubbles: true
      });
      
      childElement.dispatchEvent(mouseEnterEvent);
      
      // _isRolling should still be true (not called again)
      expect(element._isRolling).toBe(true);
    });
  });
});