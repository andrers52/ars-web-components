/**
 * Tests for DraggableMixin
 * @vi-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, vi } from 'vitest';

// Import the module
import { DraggableMixin } from '../src/mixins/draggable-mixin/draggable-mixin.js';
import { PointerCoordinator } from '../src/mixins/common/pointer-coordinator.js';

describe('DraggableMixin', () => {
  let element;

  beforeEach(() => {
    vi.useFakeTimers();
    PointerCoordinator.clearAllCaptures();
    document.body.innerHTML = '';
    
    element = document.createElement('draggable-mixin');
  });

  afterEach(() => {
    vi.useRealTimers();
    PointerCoordinator.clearAllCaptures();
  });

  describe('Static properties', () => {
    it('should have observedAttributes', () => {
      expect(DraggableMixin.observedAttributes).toContain('drag-threshold');
    });
  });

  describe('Initialization', () => {
    it('should create shadow DOM', () => {
      expect(element.shadowRoot).toBeDefined();
    });

    it('should have default drag threshold', () => {
      expect(element._dragThreshold).toBe(5);
    });

    it('should not be dragging initially', () => {
      expect(element._isDragging).toBe(false);
    });
  });

  describe('Attribute handling', () => {
    it('should read drag-threshold from attribute', () => {
      element.setAttribute('drag-threshold', '10');
      document.body.appendChild(element);
      
      expect(element._dragThreshold).toBe(10);
    });

    it('should ignore invalid drag-threshold', () => {
      element.setAttribute('drag-threshold', 'invalid');
      document.body.appendChild(element);
      
      expect(element._dragThreshold).toBe(5); // default
    });

    it('should allow zero threshold', () => {
      element.setAttribute('drag-threshold', '0');
      document.body.appendChild(element);
      
      expect(element._dragThreshold).toBe(0);
    });
  });

  describe('Validation methods', () => {
    it('should validate threshold correctly', () => {
      expect(element._validateThreshold(10)).toBe(true);
      expect(element._validateThreshold(0)).toBe(true);
      expect(element._validateThreshold(-1)).toBe(false);
      expect(element._validateThreshold('invalid')).toBe(false);
    });
  });

  describe('Drag distance calculation', () => {
    it('should calculate drag distance correctly', () => {
      element._dragStartX = 0;
      element._dragStartY = 0;
      
      const distance = element._calculateDragDistance(30, 40);
      
      expect(distance).toBe(50); // sqrt(30^2 + 40^2) = 50
    });

    it('should calculate distance from non-zero start', () => {
      element._dragStartX = 100;
      element._dragStartY = 100;
      
      const distance = element._calculateDragDistance(130, 140);
      
      expect(distance).toBe(50);
    });
  });

  describe('Drag direction detection', () => {
    it('should detect right drag', () => {
      const direction = element._determineDragDirection(50, 0);
      expect(direction).toBe('right');
    });

    it('should detect left drag', () => {
      const direction = element._determineDragDirection(-50, 0);
      expect(direction).toBe('left');
    });

    it('should detect down drag', () => {
      const direction = element._determineDragDirection(0, 50);
      expect(direction).toBe('down');
    });

    it('should detect up drag', () => {
      const direction = element._determineDragDirection(0, -50);
      expect(direction).toBe('up');
    });
  });

  describe('Public API', () => {
    it('should have setDragThreshold method', () => {
      expect(typeof element.setDragThreshold).toBe('function');
    });

    it('should have onDragStart method', () => {
      expect(typeof element.onDragStart).toBe('function');
    });

    it('should have onDragMove method', () => {
      expect(typeof element.onDragMove).toBe('function');
    });

    it('should have onDragEnd method', () => {
      expect(typeof element.onDragEnd).toBe('function');
    });

    it('should dispatch dragstart event', () => {
      const eventHandler = vi.fn();
      element.addEventListener('dragstart', eventHandler);
      
      element.onDragStart({ startX: 0, startY: 0, deltaX: 10, deltaY: 10 });
      
      expect(eventHandler).toHaveBeenCalled();
    });

    it('should dispatch dragmove event', () => {
      const eventHandler = vi.fn();
      element.addEventListener('dragmove', eventHandler);
      
      element.onDragMove({ deltaX: 10, deltaY: 10, isDragging: true });
      
      expect(eventHandler).toHaveBeenCalled();
    });

    it('should dispatch dragend event', () => {
      const eventHandler = vi.fn();
      element.addEventListener('dragend', eventHandler);
      
      element.onDragEnd({ wasDragging: true, deltaX: 10, deltaY: 10 });
      
      expect(eventHandler).toHaveBeenCalled();
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
      expect(element._dragStartX).toBe(100);
      expect(element._dragStartY).toBe(100);
    });

    it('should reset dragging state on pointerdown', () => {
      element._isDragging = true;
      
      const pointerDownEvent = new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        bubbles: true
      });
      
      element.setPointerCapture = vi.fn();
      element.dispatchEvent(pointerDownEvent);
      
      expect(element._isDragging).toBe(false);
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
      
      expect(element._pointerId).toBe(1);
    });
  });

  describe('Drag detection', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      vi.advanceTimersByTime(10);
      element._dragThreshold = 10;
    });

    it('should start dragging after threshold is exceeded', () => {
      element._dragStartX = 0;
      element._dragStartY = 0;
      element._pointerDown = true;
      element._pointerId = 1;
      
      const dragstartHandler = vi.fn();
      element.addEventListener('dragstart', dragstartHandler);
      
      // Simulate pointer move beyond threshold
      element.setPointerCapture = vi.fn();
      PointerCoordinator.capturePointer(element, 1);
      
      const pointerMoveEvent = new PointerEvent('pointermove', {
        pointerId: 1,
        clientX: 20,
        clientY: 0,
        bubbles: true
      });
      
      element.dispatchEvent(pointerMoveEvent);
      
      expect(element._isDragging).toBe(true);
      expect(dragstartHandler).toHaveBeenCalled();
    });
  });
});