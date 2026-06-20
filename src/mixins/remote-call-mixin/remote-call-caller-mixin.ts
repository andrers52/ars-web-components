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
  [key: string]: any;

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

  attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null) {
    super.attributeChangedCallback && super.attributeChangedCallback(name, oldVal, newVal);
    if (this._isInitialized && oldVal !== newVal && Object.values(AttributeKeys).includes(name)) {
      this._removeListeners();
      this._setupListeners();
    }
  }

  _buildArgs(e: CustomEvent) {
    const mapAttr = this.getAttribute(AttributeKeys.ARGSMAP);
    if (!mapAttr) {
      return [];
    }
    let mapObj;
    try { mapObj = JSON.parse(mapAttr); } catch(err) { console.error('Invalid args-map JSON:', err); return []; }
    const argsArr: unknown[] = [];
    Object.entries(mapObj).forEach(([key, pos])=>{
      argsArr[pos as number] = e.detail ? (e.detail as Record<string, unknown>)[key] : undefined;
    });
    return argsArr;
  }

  _setupListeners() {
    this._removeListeners();
    const listenAttr = (this.getAttribute(AttributeKeys.LISTEN) || '').split(',').map(s=>s.trim()).filter(Boolean);
    if (listenAttr.length === 0) return;
    const target = this.findActualTargetComponent();
    if (!target) { console.warn('RemoteCallCallerMixin: no inner target found'); return; }
    const handlerFactory = (_evtName: string) => (e: CustomEvent) => {
      const targetId = this.getAttribute(AttributeKeys.TARGET);
      const method = this.getAttribute(AttributeKeys.METHOD);
      if (!targetId || !method) {
        console.warn('RemoteCallCallerMixin: target-id or method missing');
        return;
      }
      const args = this._buildArgs(e);
      this._callRemote(targetId, method, ...args);
    };
    listenAttr.forEach(evtName => {
      const h = handlerFactory(evtName);
      target.addEventListener(evtName, h as EventListener);
      this._boundHandlers.push({evt: evtName, handler: h as EventListener, target});
    });
  }

  _removeListeners() {
    this._boundHandlers.forEach(({evt, handler, target}: {evt: string, handler: EventListener, target: Element}) => {
      target.removeEventListener(evt, handler);
    });
    this._boundHandlers = [];
  }

  _callRemote(targetId: string, methodName: string, ...args: unknown[]) {
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
  callRemote(targetId: string, methodName: string, ...args: unknown[]) {
    this._callRemote(targetId, methodName, ...args);
  }

  // Simple logger used by the demo page
  log(message: string, type: string = 'info') {
    console[type === 'error' ? 'error' : 'log']('[DemoCaller]', message);
  }
}

if (typeof module !== 'undefined') {
  module.exports = { RemoteCallCallerMixin };
} else if (typeof window !== 'undefined') {
  (window as any).RemoteCallCallerMixin = RemoteCallCallerMixin;
}

export { RemoteCallCallerMixin };
