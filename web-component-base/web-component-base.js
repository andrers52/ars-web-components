'use strict'

// from: http://2ality.com/2014/12/es6-proxies.html (tracePropAccess)
function mapPropertiesToAttributes(obj, propKeys) {
  // Replace each property with a getter and a setter
  propKeys.forEach(function (propKey) {
    try {
      Object.defineProperty(obj, propKey, {
        get: function () {
          // console.log('GET ' + propKey)
          let attr = this.getAttribute(propKey)
          try {
            return JSON.parse(attr)
          } catch(e) {
            return attr
          }
          
        },
        set: function (value) {
          // console.log('SET ' + propKey + '=' + value)
          this.setAttribute(
            propKey,
            (typeof value === 'string') ?
              value : JSON.stringify(value)
          )
        },
      })
    } catch (err) {
      console.log(err)
    }

  })
  return obj
}

class WebComponentBase extends HTMLElement {

  alreadyMappedAttributes = false
  // Gets populated by attributeChangedCallback
  _attributesMap = {}
  _waitingOnAttr = {}

  

  static defaultAttributeValue() {
    /* the name of the attribute is parsed in as a parameter */
    return
  }

  static parseAttributeValue(name, value) {
    try {
      return JSON.parse(value)
    } catch (e) {
      return value // set just the string
    }

  }

  constructor() {
    super()

    this._waitingOnAttr = (
      this.constructor.observedAttributes || []
    ).filter(name => {
      if (!this.attributes.getNamedItem(name)) {
        this._attributesMap[name] = this.constructor.defaultAttributeValue(name)
      }
      return !!this.attributes.getNamedItem(name)
    })

    // No attributes so update attribute never called.
    // SO fire this anyway.
    if (this._waitingOnAttr.length === 0) {
      // RUN THIS AFTER A TIME INTERVAL TO ALLOW CHILD CONSTRUCTOR TO RUN ***
      setTimeout(
        () => { 
          this.allAttributesChangedCallback(this._attributesMap) 
        }, 
        0)      
    }
  }
  
  attributeChangedCallback(attr, oldValue, newValue) {
    this._attributesMap[attr] = this.constructor.parseAttributeValue.call(this,
      attr,
      newValue
    )

    if (this._waitingOnAttr.length) {
      const index = this._waitingOnAttr.indexOf(attr)
      if (index !== -1) {
        // Remove it from array.
        this._waitingOnAttr.splice(index, 1)
      }
    }

    // All attributes parsed
    if (this._waitingOnAttr.length === 0 && !this.alreadyMappedAttributes) {
      mapPropertiesToAttributes(this, Object.keys(this._attributesMap)) // get and set interceptors for properties
      this.allAttributesChangedCallback(this._attributesMap)
      this.alreadyMappedAttributes = true
    }
  }

  emitEvent(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }))
  }

  allAttributesChangedCallback() {} // to override

  // Utility method to connect elements in the shadow dom to their events.
  // Normally used after instantiating the template in '_render'
  // methodCallStr is  the method call at the moment of execution (not creation)
  // Examples: 
  //  this.connectElementWithEvent('id-startEditingCalendar', 'onclick', 'this.startEditingCalendar()')
  //  this.connectElementWithEvent('id-confirmAndRemoveCalendar', 'onclick', 'this.confirmAndRemoveCalendar(this.selectedCalendar)')
  connectElementWithEvent(elementId, eventStr, methodCallStr) {
    let self = this
    this.shadowRoot.getElementById(elementId)[eventStr] = 
      function() {
        eval(`${methodCallStr.replace(/this/g,'self')}`)
      }    
  }
}

export {WebComponentBase as default}
export {WebComponentBase}
