// Remote Call Receiver Mixin
// Provides functionality to receive and handle remote calls from other components

import { Assert } from 'arslib';

const RemoteCallReceiverMixin = (BaseClass) => {
  return class extends BaseClass {
    constructor() {
      super();
      // Ensure the component has an ID for remote calling
      Assert.assertIsString(this.id, "RemoteCallReceiver components must have an ID attribute");
      Assert.assertIsNotEmptyArray([this.id], "RemoteCallReceiver component ID cannot be empty");
    }

    // Lifecycle methods
    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }

      // Set up event listener for method calls using component ID
      if (this.id) {
        this._methodCallHandler = (event) => {
          if (event.detail && event.detail.method) {
            const methodName = event.detail.method;
            const args = event.detail.args || [];

            // Check if method is private (starts with _)
            if (methodName.charAt(0) === "_") {
              console.error(`Cannot call private method: ${methodName}`);
              return;
            }

            // Check if method exists
            if (typeof this[methodName] === "function") {
              try {
                this[methodName](...args);
              } catch (error) {
                console.error(`Error calling method ${methodName}:`, error);
              }
            } else {
              console.error(
                `Method ${methodName} does not exist on component ${this.id}`,
              );
            }
          }
        };

        document.addEventListener(this.id, this._methodCallHandler);
      }
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }

      // Clean up method call event listener
      if (this.id && this._methodCallHandler) {
        document.removeEventListener(this.id, this._methodCallHandler);
        this._methodCallHandler = null;
      }
    }
  };
};

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = RemoteCallReceiverMixin;
} else if (typeof window !== "undefined") {
  window.RemoteCallReceiverMixin = RemoteCallReceiverMixin;
}

export { RemoteCallReceiverMixin };
