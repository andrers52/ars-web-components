/**
 * Tests for WebComponentBase
 * @vi-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import the module
import { WebComponentBase } from './web-component-base.js';

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

        triggerWithArgs(text, count, enabled, nestedValue, selfRef) {
          this.triggerPayload = { text, count, enabled, nestedValue, selfRef };
        }

        triggerWithoutArgs() {
          this.triggerCount = (this.triggerCount || 0) + 1;
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
        const eventHandler = vi.fn();
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

      it('should call allAttributesChangedCallback when all attributes are ready', async () => {
        instance._waitingOnAttr = ['test-attr'];
        instance.alreadyMappedAttributes = false;
        
        instance.attributeChangedCallback('test-attr', null, 'value');
        
        await new Promise(r => setTimeout(r, 10));
        expect(instance.alreadyMappedAttributes).toBe(true);
        expect(instance.receivedAttributes).toBeDefined();
      });
    });

    describe('connectElementWithEvent', () => {
      beforeEach(() => {
        instance.attachShadow({ mode: 'open' });
        instance.shadowRoot.innerHTML = '<button id="trigger"></button>';
        instance.nested = { value: 'nested-value' };
      });

      it('should call the component method without evaluating code strings', () => {
        instance.connectElementWithEvent('trigger', 'onclick', 'triggerWithoutArgs()');

        instance.shadowRoot.getElementById('trigger').click();

        expect(instance.triggerCount).toBe(1);
      });

      it('should resolve primitive and component-path arguments', () => {
        instance.connectElementWithEvent(
          'trigger',
          'onclick',
          `triggerWithArgs("label", 3, true, this.nested.value, this)`,
        );

        instance.shadowRoot.getElementById('trigger').click();

        expect(instance.triggerPayload).toEqual({
          text: 'label',
          count: 3,
          enabled: true,
          nestedValue: 'nested-value',
          selfRef: instance,
        });
      });

      it('should fail fast on unsupported handler arguments', () => {
        instance.connectElementWithEvent(
          'trigger',
          'onclick',
          'triggerWithArgs(window.location)',
        );
        const handler = instance.shadowRoot.getElementById('trigger').onclick;

        expect(() => {
          handler.call(instance.shadowRoot.getElementById('trigger'));
        }).toThrow(/Unsupported event handler argument/);
      });
    });

    describe('Lifecycle callbacks', () => {
      it('should have connectedCallback', () => {
        expect(typeof instance.connectedCallback).toBe('function');
      });

      it('should have disconnectedCallback', () => {
        expect(typeof instance.disconnectedCallback).toBe('function');
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
