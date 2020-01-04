import Assert from '../../../arslib/util/assert.js'

export default function RemoteCallReceiver(classToExtend) {
  return class extends classToExtend {
    
    // If you are using this and implementing "connectedCallback" and "disconnectedCallback"
    // remeber to call "super" in them
    connectedCallback() {
      super.connectedCallback()
      this._addMethodCallEventListener()
    }
    disconnectedCallback() {
      super.disconnectedCallback()
      window.removeEventListener(this.localName)
    }
    _addMethodCallEventListener() {
      this.addEventListener(
        this.localName,
        event => {
          try {
            Assert.assert(event.detail.method.charAt(0) !== '_', 'Cannot call private methods')
            this[event.detail.method](...event.detail.args)              
          } catch (error) {
            console.log(`An error occurred while trying to remotely call ${event.detail.method}: ${error}`)
          }
        }
      )  
    }
    
  }
}