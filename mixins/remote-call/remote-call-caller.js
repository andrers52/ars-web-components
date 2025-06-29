// Remote Call Caller Mixin
// Provides functionality to make remote calls to other components

const RemoteCallCallerMixin = (BaseClass) =>
  class extends BaseClass {
    constructor() {
      super();
      this._remoteCallId = null;
      this._remoteCallTimeout = null;
      this._pendingCalls = new Map();
      this._responseHandler = this._onRemoteCallResponse.bind(this);
    }

    // Public static methods
    static get observedAttributes() {
      return ["remote-call-id", "remote-call-timeout"];
    }

    // Private utility functions
    #generateCallId() {
      return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    #validateCallId(callId) {
      return typeof callId === "string" && callId.trim().length > 0;
    }

    #validateTimeout(timeout) {
      const num = parseInt(timeout);
      return !isNaN(num) && num > 0;
    }

    #createCustomEvent(callId, data = {}) {
      return new CustomEvent("remote-call", {
        detail: {
          callId,
          data,
          timestamp: Date.now(),
        },
        bubbles: true,
        composed: true,
      });
    }

    #handleCallResponse(event, callId, resolve, reject, timeout) {
      if (event.detail.callId === callId) {
        clearTimeout(timeout);
        document.removeEventListener(
          "remote-call-response",
          this.#responseHandler,
        );
        resolve(event.detail.data);
      }
    }

    #responseHandler = null;

    // Public instance methods
    async makeRemoteCall(data = {}, timeoutMs = 5000, targetId = null) {
      const callId = this.#generateCallId();
      const timeout = this.#validateTimeout(timeoutMs) ? timeoutMs : 5000;

      console.log("[RemoteCallCaller] Making remote call:", { callId, data, targetId });

      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          this._pendingCalls.delete(callId);
          console.error("[RemoteCallCaller] Call timed out:", callId);
          reject(new Error(`Remote call timeout after ${timeout}ms`));
        }, timeout);

        this._pendingCalls.set(callId, (result) => {
          clearTimeout(timeoutId);
          console.log("[RemoteCallCaller] Call resolved:", callId, result);
          resolve(result);
        });

        const event = new CustomEvent("remote-call", {
          detail: {
            callId,
            ...data,
          },
          bubbles: true,
          composed: true,
        });

        console.log("[RemoteCallCaller] Dispatching event:", event.detail);

        // Dispatch to the target element if provided, else document
        if (targetId) {
          const target = document.getElementById(targetId);
          if (target) {
            console.log("[RemoteCallCaller] Dispatching to target:", targetId);
            target.dispatchEvent(event);
          } else {
            console.warn("[RemoteCallCaller] Target not found, dispatching to document:", targetId);
            document.dispatchEvent(event);
          }
        } else {
          console.log("[RemoteCallCaller] Dispatching to document");
          document.dispatchEvent(event);
        }
      });
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

    // Lifecycle methods
    connectedCallback() {
      document.addEventListener("remote-call-result", this._responseHandler);
      if (super.connectedCallback) super.connectedCallback();

      const callId = this.getAttribute("remote-call-id");
      if (this.#validateCallId(callId)) {
        this._remoteCallId = callId;
      }

      const timeout = this.getAttribute("remote-call-timeout");
      if (this.#validateTimeout(timeout)) {
        this._remoteCallTimeout = parseInt(timeout);
      }
    }

    disconnectedCallback() {
      document.removeEventListener("remote-call-result", this._responseHandler);
      if (super.disconnectedCallback) super.disconnectedCallback();

      if (this._remoteCallTimeout) {
        clearTimeout(this._remoteCallTimeout);
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (super.attributeChangedCallback) {
        super.attributeChangedCallback(name, oldValue, newValue);
      }

      if (name === "remote-call-id" && this.#validateCallId(newValue)) {
        this._remoteCallId = newValue;
      } else if (
        name === "remote-call-timeout" &&
        this.#validateTimeout(newValue)
      ) {
        this._remoteCallTimeout = parseInt(newValue);
      }
    }

    _onRemoteCallResponse(event) {
      console.log("[RemoteCallCaller] Received response:", event.detail);
      const { callId, result } = event.detail;
      if (this._pendingCalls.has(callId)) {
        console.log("[RemoteCallCaller] Processing response for callId:", callId);
        this._pendingCalls.get(callId)(result);
        this._pendingCalls.delete(callId);
      } else {
        console.warn("[RemoteCallCaller] No pending call found for callId:", callId);
      }
    }
  };

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = RemoteCallCallerMixin;
} else if (typeof window !== "undefined") {
  window.RemoteCallCallerMixin = RemoteCallCallerMixin;
}

export { RemoteCallCallerMixin };
