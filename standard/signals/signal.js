import { Signal as $Signal } from "signal-polyfill";
// ONE DAY // const { Signal: $Signal } = globalThis;

const {
  Computed: C,
  State: S,
  subtle: { Watcher: W, untrack }
} = $Signal;

const { toPrimitive } = Symbol;

export const value = Symbol('value');

// for `instanceof Signal` operations (aka: isSignal)
export class Signal {
  constructor(_) { this[value] = _ }
  // signal == value
  [toPrimitive]() { return this[value].get() }
  valueOf() { return this[value].get() }
  // the beauty of previous APIs (libraries or standard)
  peek() { return untrack(() => this[value].get()) }
  toJSON() { return untrack(() => this[value].get()) }
}

class Computed extends Signal {
  get value() { return this[value].get() }
}

class State extends Signal {
  get value() { return this[value].get() }
  set value(_) { this[value].set(_) }
}

const computed = (callback, ...rest) => new Computed(new C(callback, ...rest));

const signal = (value, ...rest) => new State(new S(value, ...rest));

// async effect related (aka: auto batch)
let processPending = true;

const w = new W(() => {
  if (processPending) {
    processPending = false;
    queueMicrotask(pending);
  }
});

const pending = () => {
  processPending = true;
  for (const s of w.getPending()) s.get();
  w.watch();
};

const effect = callback => {
  let cleanup = null;
  const computed = new C(() => {
    typeof cleanup === 'function' && cleanup();
    cleanup = callback();
  });
  w.watch(computed);
  computed.get();
  return () => {
    w.unwatch(computed);
    typeof cleanup === 'function' && cleanup();
    cleanup = null;
  };
};

export { computed, effect, signal, untrack };
