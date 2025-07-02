// Remote Call Receiver MIXIN
// Wraps a component and exposes its public methods for remote invocation via 'remote-call' event.
// Example:
//   <remote-call-receiver-mixin id="player" allow="play,pause">
//       <audio-player></audio-player>
//   </remote-call-receiver-mixin>
// Callers can then do: caller.callRemote('player','play')

import { MixinBase } from '../common/mixin-base.js';

const AttributeKeys = {
  ALLOW: 'allow', // comma separated whitelist, optional
  DENY: 'deny',   // blacklist, optional
};

const EVENT_NAME = 'remote-call';

class RemoteCallReceiverMixin extends MixinBase() {
  static get observedAttributes() {
    return ['id', ...Object.values(AttributeKeys)];
  }

  constructor() {
    super();
    this._boundHandler = this._handleRemoteCall.bind(this);
  }

  connectedCallback() {
    super.connectedCallback && super.connectedCallback();
    document.addEventListener(EVENT_NAME, this._boundHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback && super.disconnectedCallback();
    document.removeEventListener(EVENT_NAME, this._boundHandler);
  }

  _parseList(attr) {
    const v = (this.getAttribute(attr) || '').trim();
    return v ? v.split(',').map(s=>s.trim()).filter(Boolean) : null;
  }

  /** override handler to forward to inner component */
  _handleRemoteCall(event) {
    const { targetId, method, args = [] } = event.detail || {};
    console.log(`📦 Receiver mixin ${this.id} received remote call: ${targetId}.${method}(${args.join(', ')})`);

    if (!targetId || targetId !== this.id) {
      console.log(`❌ Remote call not for this mixin (targetId: ${targetId}, this.id: ${this.id})`);
      return;
    }

    console.log(`✅ Remote call matches this mixin: ${this.id}`);

    const allowList = this._parseList(AttributeKeys.ALLOW);
    const denyList  = this._parseList(AttributeKeys.DENY);

    if (method.startsWith('_')) {
      console.error(`Cannot call private method: ${method}`);
      return;
    }
    if (denyList && denyList.includes(method)) {
      console.warn(`Method ${method} is denied on ${this.id}`);
      return;
    }
    if (allowList && !allowList.includes(method)) {
      console.warn(`Method ${method} not in allow list on ${this.id}`);
      return;
    }

    const target = this.findActualTargetComponent();
    if (!target) {
      console.error('RemoteCallReceiverMixin: no inner target');
      return;
    }

    console.log(`🎯 Forwarding call to inner component: ${method}(${args.join(', ')})`);

    if (typeof target[method] !== 'function') {
      console.error(`Method ${method} does not exist on wrapped component of ${this.id}`);
      return;
    }

    try {
      target[method](...args);
      console.log(`✅ Method ${method} executed successfully on wrapped component of ${this.id}`);
    } catch(err) {
      console.error(`Error executing ${method} on wrapped component of ${this.id}:`, err);
    }
  }
}

customElements.define('remote-call-receiver-mixin', RemoteCallReceiverMixin);

if (typeof module !== 'undefined') {
  module.exports = { RemoteCallReceiverMixin };
} else if (typeof window !== 'undefined') {
  window.RemoteCallReceiverMixin = RemoteCallReceiverMixin;
}

export { RemoteCallReceiverMixin };
