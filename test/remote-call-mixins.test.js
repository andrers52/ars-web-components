/**
 * Tests for RemoteCallCallerMixin and RemoteCallReceiverMixin
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest, vi } from '@jest/globals';

// Import the modules
import { RemoteCallCallerMixin } from '../mixins/remote-call-mixin/remote-call-caller-mixin.js';
import { RemoteCallReceiverMixin } from '../mixins/remote-call-mixin/remote-call-receiver-mixin.js';

describe('RemoteCallCallerMixin', () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = '';
    element = document.createElement('remote-call-caller-mixin');
  });

  describe('Static properties', () => {
    it('should have observedAttributes', () => {
      expect(RemoteCallCallerMixin.observedAttributes).toContain('target-id');
      expect(RemoteCallCallerMixin.observedAttributes).toContain('method');
      expect(RemoteCallCallerMixin.observedAttributes).toContain('listen');
      expect(RemoteCallCallerMixin.observedAttributes).toContain('args-map');
    });
  });

  describe('Initialization', () => {
    it('should initialize bound handlers array', () => {
      expect(element._boundHandlers).toEqual([]);
    });

    it('should not be initialized initially', () => {
      expect(element._isInitialized).toBe(false);
    });
  });

  describe('Lifecycle', () => {
    it('should have connectedCallback', () => {
      expect(typeof element.connectedCallback).toBe('function');
    });

    it('should have disconnectedCallback', () => {
      expect(typeof element.disconnectedCallback).toBe('function');
    });

    it('should set initialized flag on connect', () => {
      document.body.appendChild(element);
      
      expect(element._isInitialized).toBe(true);
    });

    it('should remove listeners on disconnect', () => {
      document.body.appendChild(element);
      element._boundHandlers = [{ evt: 'test', handler: jest.fn(), target: element }];
      
      element.disconnectedCallback();
      
      expect(element._boundHandlers).toEqual([]);
    });
  });

  describe('_buildArgs', () => {
    it('should return empty array if no args-map', () => {
      const result = element._buildArgs({});
      
      expect(result).toEqual([]);
    });

    it('should parse args-map JSON', () => {
      element.setAttribute('args-map', '{"value": 0}');
      
      const result = element._buildArgs({ detail: { value: 'test' } });
      
      expect(result).toEqual(['test']);
    });

    it('should handle invalid args-map JSON', () => {
      element.setAttribute('args-map', 'invalid json');
      
      const result = element._buildArgs({});
      
      expect(result).toEqual([]);
    });

    it('should map multiple args', () => {
      element.setAttribute('args-map', '{"a": 0, "b": 1}');
      
      const result = element._buildArgs({ detail: { a: 'first', b: 'second' } });
      
      expect(result).toEqual(['first', 'second']);
    });
  });

  describe('_callRemote', () => {
    it('should dispatch remote-call event', () => {
      const eventHandler = jest.fn();
      document.addEventListener('remote-call', eventHandler);
      
      element._callRemote('targetId', 'methodName', 'arg1', 'arg2');
      
      expect(eventHandler).toHaveBeenCalled();
      const event = eventHandler.mock.calls[0][0];
      expect(event.detail.targetId).toBe('targetId');
      expect(event.detail.method).toBe('methodName');
      expect(event.detail.args).toEqual(['arg1', 'arg2']);
      
      document.removeEventListener('remote-call', eventHandler);
    });
  });

  describe('Public API', () => {
    it('should have callRemote method', () => {
      expect(typeof element.callRemote).toBe('function');
    });

    it('should have log method', () => {
      expect(typeof element.log).toBe('function');
    });

    it('callRemote should call _callRemote', () => {
      const spy = jest.spyOn(element, '_callRemote');
      
      element.callRemote('target', 'method', 'arg');
      
      expect(spy).toHaveBeenCalledWith('target', 'method', 'arg');
    });
  });
});

describe('RemoteCallReceiverMixin', () => {
  let element;

  beforeEach(() => {
    document.body.innerHTML = '';
    element = document.createElement('remote-call-receiver-mixin');
    element.id = 'test-receiver';
  });

  describe('Static properties', () => {
    it('should have observedAttributes', () => {
      expect(RemoteCallReceiverMixin.observedAttributes).toContain('id');
      expect(RemoteCallReceiverMixin.observedAttributes).toContain('allow');
      expect(RemoteCallReceiverMixin.observedAttributes).toContain('deny');
    });
  });

  describe('Lifecycle', () => {
    it('should have connectedCallback', () => {
      expect(typeof element.connectedCallback).toBe('function');
    });

    it('should have disconnectedCallback', () => {
      expect(typeof element.disconnectedCallback).toBe('function');
    });

    it('should add event listener on connect', () => {
      const addSpy = jest.spyOn(document, 'addEventListener');
      
      element.connectedCallback();
      
      expect(addSpy).toHaveBeenCalledWith('remote-call', expect.any(Function));
    });

    it('should remove event listener on disconnect', () => {
      const removeSpy = jest.spyOn(document, 'removeEventListener');
      
      element.connectedCallback();
      element.disconnectedCallback();
      
      expect(removeSpy).toHaveBeenCalledWith('remote-call', expect.any(Function));
    });
  });

  describe('_parseList', () => {
    it('should parse comma-separated list', () => {
      element.setAttribute('allow', 'method1, method2, method3');
      
      const result = element._parseList('allow');
      
      expect(result).toEqual(['method1', 'method2', 'method3']);
    });

    it('should return null for empty attribute', () => {
      const result = element._parseList('allow');
      
      expect(result).toBeNull();
    });

    it('should filter empty strings', () => {
      element.setAttribute('allow', 'method1, , method2');
      
      const result = element._parseList('allow');
      
      expect(result).toEqual(['method1', 'method2']);
    });
  });

  describe('_handleRemoteCall', () => {
    let mockTarget;
    let mockEvent;

    beforeEach(() => {
      mockTarget = {
        testMethod: jest.fn()
      };
      element.findActualTargetComponent = () => mockTarget;
      
      mockEvent = {
        detail: {
          targetId: 'test-receiver',
          method: 'testMethod',
          args: ['arg1', 'arg2']
        }
      };
    });

    it('should ignore calls to different target', () => {
      mockEvent.detail.targetId = 'other-receiver';
      
      element._handleRemoteCall(mockEvent);
      
      expect(mockTarget.testMethod).not.toHaveBeenCalled();
    });

    it('should call method on target', () => {
      element._handleRemoteCall(mockEvent);
      
      expect(mockTarget.testMethod).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should not call private methods', () => {
      mockEvent.detail.method = '_privateMethod';
      
      element._handleRemoteCall(mockEvent);
      
      expect(mockTarget._privateMethod).toBeUndefined();
    });

    it('should respect deny list', () => {
      element.setAttribute('deny', 'testMethod');
      
      element._handleRemoteCall(mockEvent);
      
      expect(mockTarget.testMethod).not.toHaveBeenCalled();
    });

    it('should respect allow list', () => {
      element.setAttribute('allow', 'otherMethod');
      
      element._handleRemoteCall(mockEvent);
      
      expect(mockTarget.testMethod).not.toHaveBeenCalled();
    });

    it('should call method if in allow list', () => {
      element.setAttribute('allow', 'testMethod');
      
      element._handleRemoteCall(mockEvent);
      
      expect(mockTarget.testMethod).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should handle missing method', () => {
      mockEvent.detail.method = 'nonExistentMethod';
      
      // Should not throw
      expect(() => element._handleRemoteCall(mockEvent)).not.toThrow();
    });

    it('should handle missing target', () => {
      element.findActualTargetComponent = () => null;
      
      // Should not throw
      expect(() => element._handleRemoteCall(mockEvent)).not.toThrow();
    });

    it('should handle method errors', () => {
      mockTarget.testMethod = () => {
        throw new Error('Method error');
      };
      
      // Should not throw
      expect(() => element._handleRemoteCall(mockEvent)).not.toThrow();
    });
  });

  describe('findActualTargetComponent', () => {
    it('should have findActualTargetComponent method', () => {
      expect(typeof element.findActualTargetComponent).toBe('function');
    });
  });
});