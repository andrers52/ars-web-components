//  Notes: if the class using the mixing implements the method 'connectedCallback' it 
// MUST call 'super.connectedCallback'

// Usage:
// import ArsLocalized from '<path_to>/ars-localized.js'
// export default class <ClassToUseMixin> extends ArsLocalized(<BaseElement>, '<language>') {...}, where '<language>' must be a valid language in Localization
// add to html: [[localization.<key>]] , where <key> must be added to the Localization object (see file imported below)

import Localization from '../../../arslib/util/singleton/Localization.js'

export default function ArsLocalized (classToExtend, language, symbols) {
  return class extends classToExtend {
    connectedCallback() {
      super.connectedCallback && super.connectedCallback()
      this.localization = Localization(language, symbols)
    }
  }
}




