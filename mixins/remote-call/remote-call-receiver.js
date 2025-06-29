// Remote Call Receiver Mixin
// Provides functionality to receive and handle remote calls from other components

const RemoteCallReceiverMixin = (BaseClass) => {
  return class extends BaseClass {
    constructor() {
      super();
      this._remoteCallId = null;
      this._isListening = false;
    }

    // Public static methods
    static get observedAttributes() {
      return ["remote-call-id"];
    }

    // Private utility functions
    #validateCallId(callId) {
      return typeof callId === "string" && callId.trim().length > 0;
    }

    #createResponseEvent(callId, result = {}) {
      return new CustomEvent("remote-call-result", {
        detail: {
          callId,
          result,
          timestamp: Date.now(),
        },
        bubbles: true,
        composed: true,
      });
    }

    #handleRemoteCall(event) {
      if (event.detail && event.detail.callId) {
        const response = this.processRemoteCall(event.detail);
        const responseEvent = this.#createResponseEvent(
          event.detail.callId,
          response,
        );
        document.dispatchEvent(responseEvent);
      }
    }

    #startListening() {
      if (!this._isListening) {
        document.addEventListener(
          "remote-call",
          this.#handleRemoteCall.bind(this),
        );
        this._isListening = true;
      }
    }

    #stopListening() {
      if (this._isListening) {
        document.removeEventListener(
          "remote-call",
          this.#handleRemoteCall.bind(this),
        );
        this._isListening = false;
      }
    }

    // Public instance methods - override this in your component
    processRemoteCall(data) {
      // Default implementation - override in your component
      console.log("Remote call received:", data);
      return { success: true, message: "Call processed" };
    }

    // Lifecycle methods
    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }

      const callId = this.getAttribute("remote-call-id");
      if (this.#validateCallId(callId)) {
        this._remoteCallId = callId;
        this.#startListening();
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

      this.#stopListening();

      // Clean up method call event listener
      if (this.id && this._methodCallHandler) {
        document.removeEventListener(this.id, this._methodCallHandler);
        this._methodCallHandler = null;
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(name, oldValue, newValue);
      }

      if (name === "remote-call-id") {
        this.#stopListening();

        if (this.#validateCallId(newValue)) {
          this._remoteCallId = newValue;
          this.#startListening();
        } else {
          this._remoteCallId = null;
        }
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
