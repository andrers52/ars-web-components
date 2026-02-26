
/**
 * Tests for ShowIfPropertyTrueMixin
 * @vi-environment jsdom
 */

import { describe, it, expect, beforeEach, vi, vi } from 'vitest';

// Import the module
import { ShowIfPropertyTrueMixin } from '../src/mixins/show-if-property-true-mixin/show-if-property-true-mixin.js';

describe('ShowIfPropertyTrueMixin', () => {
  let element;
  let childElement;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    
    element = document.createElement('show-if-property-true-mixin');
    childElement = document.createElement('div');
    childElement.id = 'child';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Static properties', () => {
    it('should have observedAttributes', () => {
      expect(ShowIfPropertyTrueMixin.observedAttributes).toContain('show-if-property');
    });
  });

  describe('Initialization', () => {
    it('should create shadow DOM', () => {
      expect(element.shadowRoot).toBeDefined();
    });

    it('should have null show property initially', () => {
      expect(element._showProperty).toBeNull();
    });
  });

  describe('Attribute handling', () => {
    it('should read show-if-property from attribute', () => {
      element.setAttribute('show-if-property', 'isVisible');
      document.body.appendChild(element);
      element.appendChild(childElement);
      
      vi.advanceTimersByTime(10);
      
      expect(element._showProperty).toBe('isVisible');
    });
  });

  describe('Public API', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      element.appendChild(childElement);
      vi.advanceTimersByTime(10);
    });

    it('should have setShowProperty method', () => {
      expect(typeof element.setShowProperty).toBe('function');
    });

    it('should have getShowProperty method', () => {
      expect(typeof element.getShowProperty).toBe('function');
    });

    it('should have refreshVisibility method', () => {
      expect(typeof element.refreshVisibility).toBe('function');
    });

    it('setShowProperty should update property and attribute', () => {
      element.setShowProperty('myProperty');
      
      expect(element._showProperty).toBe('myProperty');
      expect(element.getAttribute('show-if-property')).toBe('myProperty');
    });

    it('getShowProperty should return current property', () => {
      element._showProperty = 'testProp';
      
      expect(element.getShowProperty()).toBe('testProp');
    });
  });

  describe('Visibility control', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      element.appendChild(childElement);
      vi.advanceTimersByTime(10);
    });

    it('should hide element when property is false', () => {
      childElement.isVisible = false;
      element.setShowProperty('isVisible');
      
      expect(childElement.style.display).toBe('none');
    });

    it('should show element when property is true', () => {
      childElement.isVisible = true;
      element.setShowProperty('isVisible');
      
      expect(childElement.style.display).not.toBe('none');
    });

    it('should read data attribute', () => {
      childElement.setAttribute('data-isVisible', 'true');
      element.setShowProperty('isVisible');
      
      expect(childElement.style.display).not.toBe('none');
    });

    it('should read regular attribute', () => {
      childElement.setAttribute('isVisible', 'true');
      element.setShowProperty('isVisible');
      
      expect(childElement.style.display).not.toBe('none');
    });

    it('should use keep-space-when-hidden attribute', () => {
      element.setAttribute('keep-space-when-hidden', '');
      childElement.isVisible = false;
      element.setShowProperty('isVisible');
      
      expect(childElement.style.visibility).toBe('hidden');
      expect(childElement.style.display).not.toBe('none');
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

  describe('Property validation', () => {
    it('should reject empty property name', () => {
      element.setShowProperty('');
      
      expect(element._showProperty).toBeNull();
    });

    it('should reject whitespace-only property name', () => {
      element.setShowProperty('   ');
      
      expect(element._showProperty).toBeNull();
    });
  });

  describe('refreshVisibility', () => {
    beforeEach(() => {
      document.body.appendChild(element);
      element.appendChild(childElement);
      vi.advanceTimersByTime(10);
    });

    it('should update visibility when called', () => {
      element.setShowProperty('isVisible');
      
      childElement.isVisible = false;
      element.refreshVisibility();
      
      expect(childElement.style.display).toBe('none');
      
      childElement.isVisible = true;
      element.refreshVisibility();
      
      expect(childElement.style.display).not.toBe('none');
    });
  });
});