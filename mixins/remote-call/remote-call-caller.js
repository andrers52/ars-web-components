function RemoteCallCaller(classToExtend) {
  return class extends classToExtend {
    _callRemote(elementToCall, method, ...args) {
      console.log(
        "RemoteCallCaller: Dispatching call to",
        elementToCall,
        "method:",
        method,
        "args:",
        args,
      );
      this.dispatchEvent(
        new CustomEvent(elementToCall, {
          detail: { method, args },
          bubbles: true,
          composed: true,
        }),
      );
      console.log("RemoteCallCaller: Event dispatched");
    }
  };
}

export { RemoteCallCaller as default, RemoteCallCaller };
