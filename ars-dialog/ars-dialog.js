// usage:

// -- DIALOG --
// const result = await ArsDialog.dialog(`content: <br> <input id='test'></input>`,'dialog_tittle')
// if(!result) {console.log('no data returned'); return}
// // this is an example of how to retrieve information from the dialog
// console.log(`data inside input is ${result.querySelector('input').value}`)

// -- NOTIFICATION --
// - option to wait for the user to close notification
//  await ArsDialog.notify('content', 'title')
//  console.log('you just closed the notification!')
// - option to continue right away (fire and forget)
//  ArsDialog.notify('content', 'title')


import '../ars-button/ars-button.js'
import WebComponentBase from '../web-component-base/web-component-base.js'

class ArsDialog extends WebComponentBase {
  constructor() {
    super()
  }
  connectedCallback() {
  }

  _getTemplate() {
    return `
      <style>
        .overlay {
          background-color: cyan;
          position: fixed;
          visibility: hidden;
          width: 100vw;
          height: 100vh;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.4);
          z-index: 2;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          align-items: center;
        }
        .body {
          max-width: 80vw;
          min-width: 230px;
          min-height: 50px;
          max-height: 80%;      
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: white;
          border-radius: 7px;
        }

        .title {
          width: 90%;
          height: 25px;
          padding: 5px;
        }
        .content {
          margin: auto;
          width: 96%;
          height: 100%;
          overflow-y: auto;
        }
        .footer {
          min-height: 50px;
          width: 40%;
          min-width: 210px;
          padding-top: 8px;
          padding-left: 8px;
          padding-right: 8px;
          padding-bottom: 4px;
          display: flex;
          justify-content: left;
        }
        .col {
          padding-left: 20px;
        }
      </style>
      <div id="overlay" class="overlay" style="visibility: hidden;">
        <div id="body" class="body">
          <div id="title" class="title">
            ${this.title || this.getAttribute('title') || ''}
          </div>
          <div id="content" class="content">
            ${this.content || this.getAttribute('content')}
          </div>
          <div id="footer" class="footer">
          ${this._showSelectedButtons()}
          </div>          
        </div>
      </div>
    `
  }

  _showSelectedButtons() {
    if(this.getAttribute('showConfirmButtons') === 'true') {
      return `
        <button is="ars-button" id="dialog_button_yes:${this.id}"> ${this.localizedYes || 'Yes'} </button>
        <button 
          is="ars-button"
          id="dialog_button_no:${this.id}"
          style="margin-left: 5px"
        >  ${this.localizedNo || 'No'} </button>
      `
    }
    else {
      return `
          <button is="ars-button" id="dialog_button_ok:${this.id}"> Ok </button>
      `
    }
  }
  static get observedAttributes() {
    return ['open', 'localizedYes', 'localizedNo']
  }
  attributeChangedCallback(attrName, oldVal, newVal) {
    super.attributeChangedCallback(attrName, oldVal, newVal)
    
    if(attrName === 'open' && newVal === 'true')
      this._activate()
  }

  _render() {
    this.shadowRoot.innerHTML = eval('`'+this._getTemplate()+'`')
  }

  _activate() {

    if(!this.shadowRoot)
      this.attachShadow({mode: 'open'})

    this._render()
    this.shadowRoot.getElementById('overlay').style.visibility = 'visible'
  
    let yesButton = this.shadowRoot.getElementById(`dialog_button_yes:${this.id}`)
    if(yesButton) 
      yesButton.onclick = 
        (() => {
          const content = this.shadowRoot.getElementById('content')
          this.onbuttonclick && this.onbuttonclick(content)
          this._deactivate()
        }).bind(this)

    let okButton = this.shadowRoot.getElementById(`dialog_button_ok:${this.id}`)
    if(okButton) 
      okButton.onclick = 
        (() => {
          this.onbuttonclick && this.onbuttonclick(true)
          this._deactivate()
        }).bind(this)

    let noButton = this.shadowRoot.getElementById(`dialog_button_no:${this.id}`)
    if(noButton) 
      noButton.onclick = 
        (() => {
          this.onbuttonclick && this.onbuttonclick(false)
          this._deactivate()
        }).bind(this)
  }

  _deactivate() {
    let overlay = this.shadowRoot.getElementById('overlay')
    if(overlay)
      overlay.style.visibility = 'hidden'
  }

  _isActive() {
    return this.shadowRoot.getElementById('overlay').style.visibility === 'visible'
  }

  static notify(content = '',  title = '!') {
    return new Promise(function(resolve) {
      let dialog =  document.createElement('ars-dialog')
      dialog.id = 'notification_dialog'
      dialog.setAttribute('content', content)
      dialog.setAttribute('showConfirmButtons', false)
      dialog.setAttribute('title', title)
      document.body.appendChild(dialog)
      dialog.onbuttonclick = function() {
        dialog.parentNode.removeChild(dialog)
        resolve()
      }
      dialog.setAttribute('open', true)  
    })
  }


  static dialog(content = '',  title = '', localizedYes = 'Yes', localizedNo = 'No') {
    return new Promise(function(resolve) {
      let dialog =  document.createElement('ars-dialog')
      dialog.id = 'notification_dialog'
      dialog.setAttribute('content', content)
      dialog.setAttribute('showConfirmButtons', true)
      dialog.setAttribute('title', title)
      dialog.setAttribute('localizedYes', localizedYes)
      dialog.setAttribute('localizedNo', localizedNo)
      document.body.appendChild(dialog)
      dialog.onbuttonclick = function(result) {
        dialog.parentNode.removeChild(dialog)
        resolve(result) // <content div element> or false
      }
      dialog.setAttribute('open', true)
    })
  }
}

window.customElements.define('ars-dialog', ArsDialog)

export {ArsDialog as default}
export {ArsDialog}


