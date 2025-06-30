// Remote Call Caller Mixin
// Provides functionality to make remote calls to other components

import { Assert } from 'arslib';

const RemoteCallCallerMixin = (BaseClass) =>
  class extends BaseClass {
    constructor() {
      super();
      // Ensure the component has an ID for remote calling
      Assert.assertIsString(this.id, "RemoteCallCaller components must have an ID attribute");
      Assert.assertIsNotEmptyArray([this.id], "RemoteCallCaller component ID cannot be empty");
    }

    // Method for calling remote methods on components by ID
    _callRemote(componentId, methodName, ...args) {
      const targetComponent = document.getElementById(componentId);
      if (!targetComponent) {
        console.error(`Component with ID '${componentId}' not found`);
        return;
      }

      // Create a custom event for the method call
      const event = new CustomEvent(componentId, {
        detail: {
          method: methodName,
          args: args,
          timestamp: Date.now(),
        },
        bubbles: true,
        composed: true,
      });

      // Dispatch the event
      document.dispatchEvent(event);
    }
  };

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = RemoteCallCallerMixin;
} else if (typeof window !== "undefined") {
  window.RemoteCallCallerMixin = RemoteCallCallerMixin;
}

export { RemoteCallCallerMixin };
