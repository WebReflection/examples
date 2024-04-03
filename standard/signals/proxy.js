import { Signal } from 'signal-polyfill';
import { effect } from './effect.js';

const { entries, fromEntries, hasOwn } = Object;
const { get } = Reflect;
const { State } = Signal;

const asSignal = v => v instanceof State ? v : new State(v);

const objectHandler = {
  get: (target, key, ...rest) => (
    hasOwn(target, key) ?
      target[key].get() :
      get(target, key, ...rest)
  ),
  set: (target, key, value) => (
    hasOwn(target, key) ?
      (target[key].set(value)) :
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
  nested: object({test: 456}),
  list: [1, 2, 3],
  log() {
    console.log(JSON.stringify(this));
  }
});

effect(() => {
  any.log();
});

any.nested.test++;

setTimeout(() => {
  any.test++;
  setTimeout(() => {
    any.list = [...any.list, 4];
  });
});
