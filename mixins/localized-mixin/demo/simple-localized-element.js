class SimpleLocalizedElement extends HTMLElement {
  static get observedAttributes() { return ['title', 'button-label']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <div>
        <h3 id="title"></h3>
        <button id="btn"></button>
      </div>
    `;
  }

  connectedCallback() {
    this._update();
  }

  attributeChangedCallback() {
    this._update();
  }

  _update() {
    this.shadowRoot.getElementById('title').textContent = this.getAttribute('title') || '';
    this.shadowRoot.getElementById('btn').textContent = this.getAttribute('button-label') || '';
  }
}

customElements.define('simple-localized-element', SimpleLocalizedElement);
