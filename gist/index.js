import { gist_fs } from 'https://cdn.jsdelivr.net/npm/gist-fs@0.3.2/+esm';
import IDBMap from 'https://esm.run/@webreflection/idb-map';

const store = new IDBMap(location.origin + location.pathname);


const AFile = customElements.get("a-file")
const AFolder = customElements.get("a-folder")

let id = location.search.slice(1), fs;

const stop = event => {
  event.preventDefault();
  event.stopImmediatePropagation();
  return event;
};

file_save.onclick = async event => {
  stop(event);
  const content = editor.value;
  const name = file_name.value.trim();

  if (!name) return alert('File name is required');

  file_save.disabled = true;
  if (content.length)
    await fs.write(name, content);
  else {
    await fs.rm(name);
    file_name.value = '';
  }

  file_save.disabled = false;

  list.replaceChildren();
  show_tree('./');
};

const show_content = async event => {
  const { path } = stop(event).currentTarget;
  file_name.value = path;
  editor.value = await fs.read(path);
};

const show_tree = async (path, root=list) => {
  path = path.replace(/\/+$/, '');
  for (const file of fs.ls(path)) {
    let f, sub = `${path}/${file}`;
    if (fs.isDir(sub)) {
      f = new AFolder(sub);
      show_tree(sub, f);
    }
    else {
      f = new AFile(sub);
      f.onclick = show_content;
    }
    root.append(f);
  }
};

const update_location = () => {
  if (`?${id}` !== location.search)
    history.pushState(null, '', `?${id}`);
};

if (await store.has('token')) {
  authentication.remove();
  if (!id) id = await store.get('id');
  const gistfs = gist_fs(await store.get('token'));
  const ref = await gistfs.get(id);
  fs = ref.fs;
  update_location();
  show_tree('/');
}
else {
  const [input, auth] = authentication.children;
  auth.onclick = async event => {
    stop(event);
    const token = input.value.trim();
    if (!token) return alert('GitHub token with Gist access is required');
    const gistfs = gist_fs(token);
    input.disabled = true;
    auth.disabled = true;
    if (id || await store.has('id')) {
      if (!id) id = await store.get('id');
      ({ fs } = await gistfs.get(id));
    }
    else {
      const ref = await gistfs.create({ description: 'Gist Files Example' });
      await store.set('id', ref.id);
      fs = ref.fs;
      id = ref.id;
    }
    await store.set('token', token);
    update_location();
    authentication.remove();
    show_tree('/');
  };
};

editor.oninput = () => {
  file_save.textContent = editor.value ? 'Save' : 'Delete';
};
