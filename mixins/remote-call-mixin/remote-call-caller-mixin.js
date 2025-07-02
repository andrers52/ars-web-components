// Remote Call Caller
// Augments any nested component to dispatch remote-call events declaratively
// Usage:
//   <remote-call-caller-mixin target-id="chat-pane" method="setText" listen="message-send"></remote-call-caller-mixin>
// When the inner component fires the event(s) specified by `listen`, this mixin
// will forward the call to the receiver whose id is `target-id`.

import { MixinBase } from '../common/mixin-base.js';

const AttributeKeys = {
  TARGET: 'target-id',
  METHOD: 'method',
  LISTEN: 'listen',
  ARGSMAP: 'args-map', // JSON string mapping event.detail keys to positional argument index
};

const EVENT_NAME = 'remote-call';

class RemoteCallCallerMixin extends MixinBase() {
  constructor() {
    super();
    this._boundHandlers = [];
    this._isInitialized = false;
  }

  static get observedAttributes() {
    return Object.values(AttributeKeys);
  }

  connectedCallback() {
    super.connectedCallback();
    this._isInitialized = true;
    this._setupListeners();
  }

  disconnectedCallback() {
    super.disconnectedCallback && super.disconnectedCallback();
    this._removeListeners();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    super.attributeChangedCallback && super.attributeChangedCallback(name, oldVal, newVal);
    if (this._isInitialized && oldVal !== newVal && Object.values(AttributeKeys).includes(name)) {
      this._removeListeners();
      this._setupListeners();
    }
  }

  _buildArgs(e) {
    const mapAttr = this.getAttribute(AttributeKeys.ARGSMAP);
    console.log('RemoteCallCallerMixin: _buildArgs called with event:', e, 'mapAttr:', mapAttr);
    if (!mapAttr) {
      console.log('RemoteCallCallerMixin: no args-map, returning empty array');
      return [];
    }
    let mapObj;
    try { mapObj = JSON.parse(mapAttr); } catch(err) { console.error('Invalid args-map JSON:', err); return []; }
    console.log('RemoteCallCallerMixin: parsed mapObj:', mapObj, 'event.detail:', e.detail);
    const argsArr = [];
    Object.entries(mapObj).forEach(([key, pos])=>{
      argsArr[pos] = e.detail ? e.detail[key] : undefined;
      console.log('RemoteCallCallerMixin: mapped key:', key, 'to position:', pos, 'value:', argsArr[pos]);
    });
    console.log('RemoteCallCallerMixin: final args array:', argsArr);
    return argsArr;
  }

  _setupListeners() {
    this._removeListeners();
    const listenAttr = (this.getAttribute(AttributeKeys.LISTEN) || '').split(',').map(s=>s.trim()).filter(Boolean);
    if (listenAttr.length === 0) return;
    const target = this.findActualTargetComponent();
    if (!target) { console.warn('RemoteCallCallerMixin: no inner target found'); return; }
    const handlerFactory = (evtName) => (e) => {
      console.log('RemoteCallCallerMixin: received event:', evtName, e);
      const targetId = this.getAttribute(AttributeKeys.TARGET);
      const method = this.getAttribute(AttributeKeys.METHOD);
      if (!targetId || !method) {
        console.warn('RemoteCallCallerMixin: target-id or method missing');
        return;
      }
      const args = this._buildArgs(e);
      console.log('RemoteCallCallerMixin: calling remote with targetId:', targetId, 'method:', method, 'args:', args);
      this._callRemote(targetId, method, ...args);
    };
    listenAttr.forEach(evtName => {
      console.log('RemoteCallCallerMixin: setting up listener for event:', evtName, 'on target:', target);
      const h = handlerFactory(evtName);
      target.addEventListener(evtName, h);
      this._boundHandlers.push({evt: evtName, handler: h, target});
    });
  }

  _removeListeners() {
    this._boundHandlers.forEach(({evt, handler, target}) => {
      target.removeEventListener(evt, handler);
    });
    this._boundHandlers = [];
  }

  _callRemote(targetId, methodName, ...args) {
    const detail = {
      targetId,
      method: methodName,
      args,
      timestamp: Date.now(),
    };
    const event = new CustomEvent(EVENT_NAME, {
      detail,
      bubbles: true,
      composed: true,
    });
    document.dispatchEvent(event);
  }

  // Public API so external scripts (demo) can trigger remote calls programmatically
  callRemote(targetId, methodName, ...args) {
    this._callRemote(targetId, methodName, ...args);
  }

  // Simple logger used by the demo page
  log(message, type = 'info') {
    console[type === 'error' ? 'error' : 'log']('[DemoCaller]', message);
  }
}

customElements.define('remote-call-caller-mixin', RemoteCallCallerMixin);
// Alias for legacy demo code using a subclass to avoid reusing constructor
class DemoCaller extends RemoteCallCallerMixin {
  log(message, type='info') {
    const logEl = document.getElementById('callerLog');
    if (logEl) {
      const entry = document.createElement('div');
      entry.className = `log-entry ${type}`;
      entry.textContent = message;
      logEl.appendChild(entry);
      logEl.scrollTop = logEl.scrollHeight;
    }
    console[type==='error'?'error':'log']('[DemoCaller]', message);
  }
}
customElements.define('demo-caller', DemoCaller);

if (typeof module !== 'undefined') {
  module.exports = { RemoteCallCallerMixin };
} else if (typeof window !== 'undefined') {
  window.RemoteCallCallerMixin = RemoteCallCallerMixin;
}

export { RemoteCallCallerMixin };
