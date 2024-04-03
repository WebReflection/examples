import { effect, signal, Signal } from './signal.js';

const { entries, fromEntries, hasOwn } = Object;
const { get } = Reflect;

const asSignal = v => v instanceof Signal ? v : signal(v);

const objectHandler = {
  get: (target, key, ...rest) => (
    hasOwn(target, key) ?
      target[key].value :
      get(target, key, ...rest)
  ),
  set: (target, key, value) => (
    hasOwn(target, key) ?
      (target[key].value = value) :
      (target[key] = asSignal(value)),
    true
  ),
};

const object = literal => {
  const kv = [];
  for (const [k, v] of entries(literal))
    kv.push([k, asSignal(v)]);
  return new Proxy(fromEntries(kv), objectHandler);
};

const any = object({
  test: 123,
  log() {
    console.log(JSON.stringify(this));
  }
});

effect(() => {
  any.log();
});

any.test++;
console.log('OK');
