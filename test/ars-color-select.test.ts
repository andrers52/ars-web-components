/**
 * Tests for ArsColorSelect
 * @vi-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, vi } from 'vitest';

// Import the module
import { ArsColorSelect } from '../src/components/ars-color-select/ars-color-select.js';

describe('ArsColorSelect', () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = '';
    element = document.createElement('ars-color-select');
    element.id = 'test-color-select';
  });

  describe('Static properties', () => {
    it('should have observedAttributes', () => {
      expect(ArsColorSelect.observedAttributes).toContain('color');
    });
  });

  describe('Initialization', () => {
    it('should create shadow DOM on connect', () => {
      document.body.appendChild(element);

      expect(element.shadowRoot).toBeDefined();
    });

    it('should have a color selector element', () => {
      document.body.appendChild(element);

      const selector = element.shadowRoot.getElementById('colorSelector');
      expect(selector).toBeDefined();
    });

    it('should have options container', () => {
      document.body.appendChild(element);

      const options = element.shadowRoot.getElementById('optionsContainer');
      expect(options).toBeDefined();
    });
  });

  describe('Color selection', () => {
    beforeEach(() => {
      document.body.appendChild(element);
    });

    it('should set initial color from attribute', () => {
      element.setAttribute('color', 'Red');

      expect(element.getAttribute('color')).toBe('Red');
    });

    it('should have colors in palette', () => {
      const colorsDiv = element.shadowRoot.getElementById('colorsDiv');
      const colorDivs = colorsDiv.querySelectorAll('div');

      expect(colorDivs.length).toBeGreaterThan(0);
    });

    it('should toggle color selection visibility', () => {
      const selector = element.shadowRoot.getElementById('colorSelector');
      const options = element.shadowRoot.getElementById('optionsContainer');

      const initialVisibility = options.style.visibility;

      element.toggleColorSelection();

      expect(options.style.visibility).not.toBe(initialVisibility);
    });
  });

  describe('Events', () => {
    beforeEach(() => {
      document.body.appendChild(element);
    });

    it('should dispatch color change event when color changes', () => {
      const eventHandler = vi.fn();
      element.addEventListener('ars-color-select:change', eventHandler);

      element.setAttribute('color', 'Blue');

      expect(eventHandler).toHaveBeenCalled();
    });

    it('should include color in event detail', () => {
      // Ensure initial color is NOT Green so the change event reliably triggers
      element.setAttribute('color', 'Red');

      let eventDetail = null;
      element.addEventListener('ars-color-select:change', (e) => {
        eventDetail = e.detail;
      });

      element.setAttribute('color', 'Green');

      expect(eventDetail.color).toBe('Green');
    });

    it('should include id in event detail', () => {
      // Ensure initial color is NOT Yellow
      element.setAttribute('color', 'Red');

      let eventDetail = null;
      element.addEventListener('ars-color-select:change', (e) => {
        eventDetail = e.detail;
      });

      element.setAttribute('color', 'Yellow');

      expect(eventDetail.id).toBe('test-color-select');
    });
  });

  describe('Public API', () => {
    beforeEach(() => {
      document.body.appendChild(element);
    });

    it('should have setBackgroundColor method', () => {
      expect(typeof element.setBackgroundColor).toBe('function');
    });

    it('should have toggleColorSelection method', () => {
      expect(typeof element.toggleColorSelection).toBe('function');
    });

    it('should set background color of selector', () => {
      const selector = element.shadowRoot.getElementById('colorSelector');

      element.setBackgroundColor('rgb(255, 0, 0)');

      expect(selector.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });
  });

  describe('Attribute handling', () => {
    it('should respond to color attribute changes', () => {
      document.body.appendChild(element);

      element.setAttribute('color', 'Purple');

      expect(element.getAttribute('color')).toBe('Purple');
    });
  });

  describe('Lifecycle', () => {
    it('should have connectedCallback', () => {
      expect(typeof element.connectedCallback).toBe('function');
    });

    it('should have attributeChangedCallback', () => {
      expect(typeof element.attributeChangedCallback).toBe('function');
    });
  });
});