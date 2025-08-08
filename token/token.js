// import IDBMap from 'https://cdn.jsdelivr.net/npm/@webreflection/idb-map@0.3.2/+esm';

let p = 0;
const fetchp = (url, ..._) => {
  const { promise, resolve, reject } = Promise.withResolvers();
  const src = new URL(url);
  const callback = `__json${p++}`;
  src.searchParams.set('callback', callback);
  document.head.appendChild(Object.assign(
    document.createElement('script'),
    { async: true, onerror: reject, src }
  ));
  globalThis[callback] = value => {
    delete globalThis[callback];
    resolve(value);
  };
  return promise;
};

let promise;
for (const [key, value] of new URLSearchParams(location.search)) {
  if (!value && /^@\S+?\/[^/\s]+$/.test(key)) {
    const value = key.split('/');
    const id = value.pop();
    const account = value.length < 2 ? value[0].slice(1) : value.join('/');
    promise = fetchp(`https://gist.github.com/${account}/${id}.json`);
  }
}

promise?.then(
  json => {
    const files = json.files;
    document.querySelector('.container').append(
      Object.assign(
        document.createElement('strong'),
        { textContent: json.description }
      ),
      Object.assign(
        document.createElement('ul'),
        { innerHTML: files.map(name => `<li>${name}</li>`).join('') }
      )
    );
  },
  error => {
    alert(error.message);
  }
);
