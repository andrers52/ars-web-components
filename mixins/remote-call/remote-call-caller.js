export default function RemoteCallCaller(classToExtend) {
  return class extends classToExtend {
    _callRemote(elementToCall, method, ...args) {
      this.dispatchEvent(new CustomEvent(elementToCall, { detail: {method, args}, bubbles: true, composed: true }))
    }
  }
}