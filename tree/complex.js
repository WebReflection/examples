const styleSheet = async url => {
  try {
    return (await import(url, { with: { type: 'css' } })).default;
  }
  catch {
    const styleSheet = new CSSStyleSheet;
    await styleSheet.replace(await fetch(url).then(r => r.text()));
    return styleSheet;
  }
};

const css = await styleSheet(import.meta.url.replace(/\.js\b/, '.css'));

const { File: GlobalFile } = globalThis;
const { reduce } = Array.prototype;
const interpolateSize = CSS.supports('interpolate-size:allow-keywords');
const nodes = new WeakMap;

const clean = parent => {
  let { childNodes } = parent;
  let { length } = childNodes;
  while (length--) {
    if (childNodes[length].nodeType === 1)
      clean(childNodes[length]);
    else if (!childNodes[length].data.trim())
      childNodes[length].remove();
  }
};

const count = (curr, { classList, lastElementChild }) => (
  curr + 1 + (
    classList.contains('folder') && classList.contains('opened') ? nested(lastElementChild) : 0
  )
);

const nested = ({ children }) => reduce.call(children, count, 0);
const height = el => getComputedStyle(el).height;

const createElement = (tag, stuff) => Object.assign(document.createElement(tag), stuff);

const transitionend = event => {
  event.stopImmediatePropagation();
  transitioning = false;
  for (const ul of event.currentTarget.closest(':host > ul').querySelectorAll('ul'))
    ul.style.height = ul.parentElement.classList.contains('opened') ? 'auto' : '0px';
};

let transitioning = false;

const get = file => {
  let li = nodes.get(file);
  if (!li) {
    li = createElement('li', { className: 'file' });
    li.append(
      createElement('button', { textContent: file.name }),
    );
    nodes.set(file, li);
  }
  return li;
};

export class File extends GlobalFile {
  constructor(fileBits, fileName, ...rest) {
    get(super(fileBits, fileName, ...rest));
  }
}

export class Folder {
  #files;
  #name;
  #ul;
  constructor(name) {
    this.#files = [];
    this.#name = name;
    this.#ul = createElement('ul');
    const li = createElement('li', { className: 'folder' });
    li.append(createElement('button', { textContent: name }), this.#ul);
    nodes.set(this, li);
  }
  get name() { return this.#name }
  get type() { return 'folder' }
  get ul() { return this.#ul }
  append(...files) {
    for (let file of files) {
      if (typeof file === 'string') {
        // .folder or folder
        if (file.lastIndexOf('.') < 1) {
          file = new Folder(file);
        }
        else {
          // infer type from extension
          file = new File([], file, { type: 'text/plain' });
        }
      }
      else if (!(file instanceof Folder)) {
        if (Symbol.iterator in file) {
          for (const f of file) this.append(f);
        }
        // create a file out of an object literal
        else if (!(file instanceof GlobalFile)) {
          file = new File(file.content ? [].concat(file.content) : [], file.name, file);
        }
      }
      this.#files.push(file);
      this.#ul.appendChild(get(file));
    }
  }
}

export class Tree extends HTMLElement {
  #root;
  constructor(data = {}) {
    const prev = super().querySelector('ul');
    const shadowRoot = this.attachShadow({ mode: 'open' });
    const { ul } = (this.#root = new Folder('#root'));
    shadowRoot.adoptedStyleSheets.push(css);
    if (prev) {
      clean(prev);
      for (const { name, value } of prev.attributes)
        ul.setAttribute(name, value);
      ul.replaceChildren(...prev.children);
    }
    shadowRoot.replaceChildren(ul);
    ul.addEventListener('click', this);
    if (data) {
      // TODO: parse data to create a tree structure
    }
  }
  append(...files) {
    this.#root.append(...files);
  }
  handleEvent(event) {
    event.preventDefault();
    const li = event.target?.closest('li');
    const button = li?.querySelector('button');
    if (!li || button.disabled) return;
    if (li.classList.contains('folder')) {
      if (!interpolateSize) {
        if (transitioning) return;
        transitioning = true;
        const opened = li.classList.contains('opened');
        const ul = li.querySelector('ul');
        ul.addEventListener('transitionend', transitionend);
        if (opened) {
          ul.animate([
            { height: height(ul) },
            { height: 0 },
          ], {
            iterations: 1,
            duration: 200,
            easing: 'ease',
          });
        }
        else {
          ul.style.height = `${parseFloat(height(li)) * nested(ul)}px`;
        }
      }
      li.classList.toggle('opened');
    }
    if (button !== document.activeElement) button.focus();
  }
}

customElements.define('file-tree', Tree);
