import { Assert } from "arslib";

function RemoteCallReceiver(classToExtend) {
  return class extends classToExtend {
    // If you are using this and implementing "connectedCallback" and "disconnectedCallback"
    // remeber to call "super" in them
    connectedCallback() {
      const eventName = this.id || this.localName;

      // Assert that the receiver has an ID for proper targeting
      Assert.assert(
        this.id,
        `RemoteCallReceiver requires an ID for proper targeting. Component ${this.localName} is missing an ID attribute.`,
      );

      console.log(
        "RemoteCallReceiver connectedCallback called for:",
        eventName,
      );
      console.log(
        "super.connectedCallback exists:",
        typeof super.connectedCallback,
      );
      super.connectedCallback && super.connectedCallback();
      console.log("Adding method call event listener for:", eventName);
      this._addMethodCallEventListener();
    }
    disconnectedCallback() {
      const eventName = this.id || this.localName;
      console.log(
        "RemoteCallReceiver disconnectedCallback called for:",
        eventName,
      );
      super.disconnectedCallback && super.disconnectedCallback();
      document.removeEventListener(eventName, this._eventHandler);
    }
    _addMethodCallEventListener() {
      const eventName = this.id || this.localName;
      console.log("Setting up event listener for:", eventName);

      // Create a bound event handler so we can remove it later
      this._eventHandler = (event) => {
        console.log("Received remote call event for:", eventName, event.detail);
        try {
          Assert.assert(
            event.detail.method.charAt(0) !== "_",
            "Cannot call private methods",
          );
          console.log(
            "Calling method:",
            event.detail.method,
            "with args:",
            event.detail.args,
          );
          this[event.detail.method](...event.detail.args);
        } catch (error) {
          console.log(
            `An error occurred while trying to remotely call ${event.detail.method}: ${error}`,
          );
        }
      };

      // Listen on document for events with this component's ID or localName
      document.addEventListener(eventName, this._eventHandler);

      console.log("Event listeners set up for:", eventName);
    }
  };
}

export { RemoteCallReceiver as default, RemoteCallReceiver };
