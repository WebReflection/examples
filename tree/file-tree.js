/** @typedef {GlobalFile|File|Folder} Item */
/** @typedef {string|ArrayBuffer|ArrayBufferView|Blob|File} Content */

const { floor, log, pow } = Math;
const { assign, defineProperties } = Object;
const { at, map, reduce } = Array.prototype;
const { File: GlobalFile } = globalThis;

const bytes = (bytes, decimals = 2) => {
  let i = 0;
  if (bytes) {
    const k = 1000;
    const dm = decimals < 0 ? 0 : decimals;
    i = floor(log(bytes) / log(k));
    bytes = (bytes / pow(k, i)).toFixed(dm);
  }
  return `${bytes} ${['bytes', 'kB', 'mB', 'gB', 'tB', 'pB', 'eB', 'zB', 'yB'][i]}`;
};

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

const convert = li => {
  const name = li.querySelector('button').textContent.trim();
  if (is(li, 'folder')) {
    const folder = new Folder(name);
    folder.append(...map.call(li.querySelector('ul').children, convert));
    return folder;
  }
  return new File(['\x00'.repeat(+li.dataset.bytes || 0)], name, {
    type: is(li, 'text') ? 'text/plain' : (li.dataset.type ?? 'application/octet-stream')
  });
};

const count = (curr, li) => (
  curr + 1 + (
    is(li, 'folder') &&
    is(li, 'opened') ?
    nested(li.querySelector('ul')) : 0
  )
);

const copy = (item, name) => {
  if (item instanceof Folder) {
    const folder = new Folder(name);
    folder.append(...item[_items]);
    return folder;
  }
  return new File([item], name, item);
};

const createElement = (tag, stuff) => assign(document.createElement(tag), stuff);

const customEvent = (detail, promise = null) => defineProperties(
  new CustomEvent('click', {
    detail,
    bubbles: true,
    cancelable: true,
  }),
  {
    waitUntil: { value: (...args) => { [promise] = args } },
    then: { value: (...args) => promise?.then(...args) },
    async: { get: () => !!promise },
  }
);

const get = file => {
  const { name, size, type } = file;
  let li = nodes.get(file);
  if (!li) {
    li = createElement('li', { className: /^text\//.test(type) ? 'text' : 'file' });
    li.appendChild(createElement('button', { textContent: name, onfocus })).dataset.bytes = bytes(+size || 0);
    nodes.set(file, li);
    refs.set(li, file);
  }
  return li;
};

const stopImmediatePropagation = event => {
  event.stopImmediatePropagation();
};

const onEnterKey = event => {
  if (event.key === 'Enter') {
    event.currentTarget.blur();
  }
};

const focused = item => {
  nodes.get(item).querySelector('button').focus();
  return item;
};

const height = el => getComputedStyle(el).height;

const is = (el, kind) => !!el?.classList?.contains?.(kind);

const nested = ({ children }) => reduce.call(children, count, 0);

const onfocus = ({ currentTarget }) => {
  selected = refs.get(currentTarget.closest('li'));
};

const ordered = (a, b) => {
  const aFolder = a instanceof Folder;
  const bFolder = b instanceof Folder;
  if (aFolder && !bFolder) return -1;
  if (!aFolder && bFolder) return 1;
  return a.name.localeCompare(b.name);
};

const path = li => {
  const chunks = [li.querySelector('button').textContent];
  while (li = li.parentNode?.closest('li'))
    chunks.unshift(li.querySelector('button').textContent);
  return chunks.join('/');
};

const replace = (oldFile, newFile) => {
  const li = nodes.get(oldFile);
  nodes.delete(oldFile);
  nodes.set(newFile, li);
  refs.set(li, newFile);
  li.querySelector('button').dataset.bytes = bytes(+newFile.size || 0);
  return newFile;
};

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

const transitionend = event => {
  stopImmediatePropagation(event);
  transitioning = false;
  for (const ul of event.currentTarget.closest(':host > ul').querySelectorAll('ul'))
    ul.style.height = is(ul.parentElement, 'opened') ? 'auto' : '0px';
};

const interpolateSize = CSS.supports('interpolate-size:allow-keywords');
const css = await styleSheet(import.meta.url.replace(/\.js\b/, '.css'));
const nodes = new WeakMap;
const refs = new WeakMap;
const _items = Symbol('items');

let transitioning = false;
let selected = null;

export class File extends GlobalFile {
  constructor(fileBits, fileName, ...rest) {
    get(super(fileBits, fileName, ...rest));
  }
}

export class Folder {
  /** @type {Item[]} */
  [_items] = [];

  /** @type {string} the name of the folder */
  #name;

  /** @type {HTMLUListElement} */
  #ul;

  /**
   * @param {string} name
   */
  constructor(name) {
    this.#name = name;
    this.#ul = createElement('ul');
    const li = createElement('li', { className: 'folder' });
    li.append(createElement('button', { textContent: name }), this.#ul);
    nodes.set(this, li);
    refs.set(li, this);
  }

  /** @type {Item[]} compatibility with Geist UI Tree.Folder props */
  get files() { return this.items }

  /** @type {Item[]} a copy ofall items within the folder */
  get items() { return this[_items].slice(0) }

  /** @type {HTMLUListElement} the UL element where the items are listed */
  get list() { return this.#ul }

  /** @type {string} the name of the folder */
  get name() { return this.#name }

  /** @type {number} the total amount of bytes within the folder */
  get size() { return this[_items].reduce((acc, file) => acc + file.size, 0) }

  /** @type {'folder'} */
  get type() { return 'folder' }

  /**
   * @param  {...(string|object|Item)} items
   * @returns
   */
  append(...items) {
    const list = this[_items];
    for (let file of items) {
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
        if (Symbol.iterator in file) this.append(...file);
        // create a file out of an object literal
        else if (!(file instanceof GlobalFile)) {
          file = new File(file.content ? [].concat(file.content) : [], file.name, file);
        }
      }
      if (!list.includes(file)) list.push(file);
      this.#ul.appendChild(get(file));
    }
    const { length } = list;
    nodes.get(this).querySelector('button').dataset.items = `${length} item${length === 1 ? '' : 's'}`;
    list.sort(ordered);
    for (let { children } = this.#ul, i = 0; i < length; i++) {
      const item = list[i];
      const li = nodes.get(item);
      if (at.call(children, i) !== li) this.#ul.insertBefore(li, at.call(children, i));
    }
    return this;
  }

  /**
   * @param  {...Item} items
   * @returns
   */
  remove(...items) {
    const list = this[_items];
    for (const item of items) {
      if (selected === item) selected = null;
      list.splice(list.indexOf(item), 1);
      const li = nodes.get(item);
      nodes.delete(item);
      refs.delete(li);
      li.remove();
    }
    return this;
  }

  /**
   * @param {Item} item
   * @param {string} [name]
   * @returns {Item | Promise<Item>}
   */
  rename(item, name = '') {
    name = name.trim();
    if (name) {
      const newItem = copy(item, name);
      this.remove(item).append(newItem);
      return focused(newItem);
    }
    else {
      const button = nodes.get(item).querySelector('button');
      name = button.textContent.trim();
      button.addEventListener('click', stopImmediatePropagation);
      button.addEventListener('keydown', onEnterKey);
      button.setAttribute('role', 'textbox');
      button.contentEditable = true;
      return new Promise(resolve => {
        button.addEventListener('blur', () => {
          button.removeEventListener('click', stopImmediatePropagation);
          button.removeEventListener('keydown', onEnterKey);
          button.removeAttribute('role');
          button.contentEditable = false;
          const newName = button.textContent.trim();
          if (name === newName) resolve(focused(item));
          else {
            const newItem = copy(item, newName);
            this.remove(item).append(newItem);
            resolve(focused(newItem));
          }
        }, { once: true });
        button.focus();
      });
    }
  }

  /**
   * @param {File|GlobalFile} file
   * @param {Content|Content[]} content
   * @returns {File|GlobalFile} the new file with the updated content
   */
  update(file, content) {
    const list = this[_items];
    return (list[list.indexOf(file)] = replace(
      file,
      new File([].concat(content), item.name, item)
    ));
  }
}

export class Tree extends HTMLElement {
  #root;

  constructor(data = {}) {
    const prev = super().querySelector('ul');
    const shadowRoot = this.attachShadow({ mode: 'open' });
    const { list } = (this.#root = new Folder('#root'));
    shadowRoot.adoptedStyleSheets.push(css);
    if (prev) {
      prev.remove();
      for (const { name, value } of prev.attributes) list.setAttribute(name, value);
      this.append(...map.call(prev.children, convert));
    }
    list.addEventListener('click', click);
    shadowRoot.replaceChildren(list);
    if (data) {
      // TODO: parse data to create a tree structure
    }
  }

  /** @type {Item|null} the last selected item */
  get selected() { return selected }

  /**
   * @param  {...(string|object|Item)} items
   * @returns
   */
  append(...items) {
    this.#root.append(...items);
    return this;
  }

  /**
   * @param  {...Item} items
   * @returns
   */
  remove(...items) {
    this.#root.remove(...items);
    return this;
  }

  /**
   * @param {Item} item
   * @param {string} [name]
   * @returns
   */
  rename(item, name = '') {
    return this.#root.rename(item, name);
  }

  /**
   * @param {File|GlobalFile} file
   * @param {Content|Content[]} content
   * @returns
   */
  update(file, content) {
    return this.#root.update(file, content);
  }
}

customElements.define('file-tree', Tree);

/**
 * @param {Event} event
 * @returns {Promise<void>}
 */
async function click(event) {
  stopImmediatePropagation(event);
  event.preventDefault();
  const li = event.target?.closest('li');
  const button = li?.querySelector('button');
  if (!li || button?.disabled || transitioning) return;
  const target = refs.get(li);
  const folder = is(li, 'folder');
  const action = folder ? (is(li, 'opened') ? 'close' : 'open') : 'click';
  event = customEvent({
    path: path(li),
    action,
    folder,
    target,
  });
  li.closest(':host > ul').parentNode.host.dispatchEvent(event);
  if (event.defaultPrevented) return;
  if (event.async) {
    li.classList.add('waiting');
    await event;
    li.classList.remove('waiting');
  }
  if (folder) {
    if (!interpolateSize) {
      transitioning = true;
      const opened = is(li, 'opened');
      const ul = li.querySelector('ul');
      ul.addEventListener('transitionend', transitionend);
      ul.animate([
        { height: opened ? height(ul) : 0 },
        { height: opened ? 0 : `${parseFloat(height(li)) * nested(ul)}px` },
      ], {
        iterations: 1,
        duration: 200,
        easing: 'ease',
      });
    }
    li.classList.toggle('opened');
  }
  if (button !== document.activeElement) button.focus();
}
