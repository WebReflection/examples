const getName = path => path.slice(path.lastIndexOf('/') + 1);

customElements.define('a-folder', class extends HTMLElement {
  #path;
  constructor(path) {
    super();
    this.#path = path;
    this.toggle = document.createElement('button');
    this.list = document.createElement('div');
    this.label = document.createElement('span');
    this.label.textContent = getName(path);
    this.opened = false;
    this.toggle.addEventListener('click', this);
    this.toggle.toggleAttribute('selected', this.children.length > 0);
    this.list.replaceChildren(...this.children);
    this.prepend(this.toggle, this.label, this.list);
  }
  attributeChangedCallback(name, _, value) {
    if (name === 'path') {
      this.#path = value;
      this.label.textContent = getName(value);
    }
  }
  handleEvent(event) {
    event.preventDefault();
    this.list.hidden = this.toggle.hasAttribute('selected');
    this.toggle.toggleAttribute('selected');
  }
  get path() {
    return this.#path;
  }
  set path(value) {
    this.setAttribute('path', value);
  }
});

customElements.define('a-file', class extends HTMLElement {
  #path;
  constructor(path) {
    super();
    this.#path = path;
    this.label = document.createElement('span');
    this.label.textContent = getName(path);
    this.prepend(this.label);
  }
  attributeChangedCallback(name, _, value) {
    if (name === 'path') {
      this.#path = value;
      this.label.textContent = getName(value);
    }
  }
  get path() {
    return this.#path;
  }
  set path(value) {
    this.setAttribute('path', value);
  }
});
