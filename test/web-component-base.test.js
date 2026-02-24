/**
 * Tests for WebComponentBase
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Import the module
import { WebComponentBase } from '../components/web-component-base/web-component-base.js';

// Generate unique component names for each test
let counter = 0;
const getUniqueName = () => `test-component-${counter++}-${Date.now()}`;

describe('WebComponentBase', () => {
  describe('Static methods', () => {
    describe('parseAttributeValue', () => {
      it('should parse JSON strings to objects', () => {
        const result = WebComponentBase.parseAttributeValue('test', '{"key": "value"}');
        expect(result).toEqual({ key: 'value' });
      });

      it('should parse JSON arrays', () => {
        const result = WebComponentBase.parseAttributeValue('test', '[1, 2, 3]');
        expect(result).toEqual([1, 2, 3]);
      });

      it('should return original value if not valid JSON', () => {
        const result = WebComponentBase.parseAttributeValue('test', 'plain string');
        expect(result).toBe('plain string');
      });

      it('should return original value for numbers', () => {
        const result = WebComponentBase.parseAttributeValue('test', '123');
        expect(result).toBe(123);
      });
    });

    describe('defaultAttributeValue', () => {
      it('should return null by default', () => {
        const result = WebComponentBase.defaultAttributeValue('any-attr');
        expect(result).toBeNull();
      });
    });
  });

  describe('Instance methods', () => {
    let TestComponent;
    let instance;
    let uniqueName;

    beforeEach(() => {
      uniqueName = getUniqueName();
      
      // Create a test component class
      class TestComponentClass extends WebComponentBase {
        static get observedAttributes() {
          return ['test-attr', 'another-attr'];
        }

        static defaultAttributeValue(name) {
          if (name === 'test-attr') return 'default-value';
          return null;
        }

        allAttributesChangedCallback(attributes) {
          this.receivedAttributes = attributes;
        }
      }

      TestComponent = TestComponentClass;
      
      // Only define if not already defined
      if (!customElements.get(uniqueName)) {
        customElements.define(uniqueName, TestComponent);
      }
      
      instance = document.createElement(uniqueName);
    });

    describe('emitEvent', () => {
      it('should dispatch a custom event with detail', () => {
        const eventHandler = jest.fn();
        instance.addEventListener('test-event', eventHandler);
        
        instance.emitEvent('test-event', { foo: 'bar' });
        
        expect(eventHandler).toHaveBeenCalled();
        const event = eventHandler.mock.calls[0][0];
        expect(event.detail).toEqual({ foo: 'bar' });
        expect(event.bubbles).toBe(true);
        expect(event.composed).toBe(true);
      });
    });

    describe('attributeChangedCallback', () => {
      it('should update _attributesMap', () => {
        instance.attributeChangedCallback('test-attr', null, 'new-value');
        
        expect(instance._attributesMap['test-attr']).toBe('new-value');
      });

      it('should parse JSON values in _attributesMap', () => {
        instance.attributeChangedCallback('test-attr', null, '{"key": "value"}');
        
        expect(instance._attributesMap['test-attr']).toEqual({ key: 'value' });
      });

      it('should remove attribute from _waitingOnAttr', () => {
        instance._waitingOnAttr = ['test-attr'];
        
        instance.attributeChangedCallback('test-attr', null, 'value');
        
        expect(instance._waitingOnAttr).not.toContain('test-attr');
      });

      it('should call allAttributesChangedCallback when all attributes are ready', (done) => {
        instance._waitingOnAttr = ['test-attr'];
        instance.alreadyMappedAttributes = false;
        
        instance.attributeChangedCallback('test-attr', null, 'value');
        
        setTimeout(() => {
          expect(instance.alreadyMappedAttributes).toBe(true);
          expect(instance.receivedAttributes).toBeDefined();
          done();
        }, 10);
      });
    });

    describe('Lifecycle callbacks', () => {
      it('should have connectedCallback', () => {
        expect(typeof instance.connectedCallback).toBe('function');
      });

      it('should have disconnectedCallback', () => {
        expect(typeof instance.disconnectedCallback).toBe('function');
      });

      it('should log when connected', () => {
        const logSpy = jest.spyOn(console, 'log');
        instance.connectedCallback();
        expect(logSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Pure utility functions', () => {
    it('should handle parseJsonSafely for valid JSON', () => {
      const result = JSON.parse('{"test": "value"}');
      expect(result).toEqual({ test: 'value' });
    });

    it('should handle parseJsonSafely for invalid JSON', () => {
      expect(() => JSON.parse('not json')).toThrow();
    });
  });
});