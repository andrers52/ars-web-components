// TODO: change to generic web component mixin
function ShowIfPropertyTrue(classToExtend, propertyToObserve) {
  return class extends classToExtend {
    constructor() {
      super()
      this._showIfTrue(propertyToObserve)
    }
    // *** TODO *** ADD PROXY TO INTERCEPT PROPERGY GET ***

    _showIfTrue(propertyToObserve) {
      this.style.display = (propertyToObserve)?  'block' : 'none'
    }
  }
}

export {ShowIfPropertyTrue as default}
export {ShowIfPropertyTrue}


