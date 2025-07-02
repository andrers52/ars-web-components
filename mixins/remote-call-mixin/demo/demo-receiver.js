class DemoReceiver extends HTMLElement {
  constructor() {
    super();
    this.counter = 0;
    this.color = '#667eea';
    this.text   = 'Waiting for remote calls...';
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        .box { padding: 10px; font-family: sans-serif; text-align: center; }
        .color-display { width: 50px; height: 20px; margin: 4px auto; border-radius: 4px; border:1px solid #ccc; }
      </style>
      <div class="box">
        <div>Counter: <span id="counter">0</span></div>
        <div class="color-display" id="colorBox"></div>
        <div id="textDisplay">Waiting for remote calls...</div>
      </div>
    `;

    // initialize display
    this._update();
  }

  _update() {
    this.shadowRoot.getElementById('counter').textContent = this.counter;
    this.shadowRoot.getElementById('colorBox').style.backgroundColor = this.color;
    this.shadowRoot.getElementById('textDisplay').textContent = this.text;
  }

  increment() {
    this.counter++; this._update(); }

  decrement() {
    this.counter--; this._update(); }

  setCounter(value) {
    const v = Number(value);
    if (!isNaN(v)) { this.counter = v; this._update(); }
  }

  changeColor(color) {
    this.color = color; this._update(); }

  setText(text) { this.text = text; this._update(); }

  _privateMethod() {
    console.warn('Private method called on DemoReceiver - should not be allowed');
  }

  // Alias methods expected by old demo code
  updateDisplay() { this._update(); }
  log(msg, type='info') {
    const logEl = document.getElementById('receiverLog');
    if (logEl) {
      const entry = document.createElement('div');
      entry.className = `log-entry ${type}`;
      entry.textContent = msg;
      logEl.appendChild(entry);
      logEl.scrollTop = logEl.scrollHeight;
    }
    console[type==='error'?'error':'log']('[DemoReceiver]', msg);
  }
}

customElements.define('demo-receiver', DemoReceiver);
