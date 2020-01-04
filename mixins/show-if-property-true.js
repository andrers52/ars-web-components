// TODO: change to generic web component mixin
export function ShowIfPropertyTrue(classToExtend, propertyToObserve) {
  return class extends classToExtend {

    // *** TODO *** ADD PROXY TO INTERCEPT PROPERGY GET ***

    _showIfTrue(propertyToObserve) {
      this.style.display = (propertyToObserve)?  'block' : 'none'
    }
  }
}


