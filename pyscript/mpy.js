const { url } = import.meta;
const base = url.slice(0, -3);
const run = code => interpreter.runPythonAsync(code);
const all = css => document.querySelectorAll(css);

let interpreter;

const loadMicroPython = async config => {
  if (!interpreter) {
    const { loadMicroPython } = await import(`${base}/micropython.mjs`);
    interpreter = await loadMicroPython({ url: `${base}/micropython.wasm`, ...config });
  }
  for (const script of all('script[type=micropython],script[type=mpy]')) {
    script.type = 'text/python';
    if (script.src) {
      fetch(script.src).then(res => res.text()).then(run);
    }
    else {
      const { textContent } = script;
      if (textContent.trim()) {
        import('https://esm.run/codedent').then(m => run(m.default(textContent)));
      }
    }
  }
  return interpreter;
};

for (const script of all('script[type=module][auto]')) {
  if (script.src === url) {
    loadMicroPython();
    break;
  }
}

export default loadMicroPython;
