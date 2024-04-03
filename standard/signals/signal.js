import { Signal as $Signal } from "signal-polyfill";
// ONE DAY // const { Signal: $Signal } = globalThis;

const {
  Computed: C,
  State: S,
  subtle: { Watcher: W, untrack }
} = $Signal;

// for `instanceof Signal` operations (aka: isSignal)
export class Signal {
  constructor(_) { this._ = _ }
  // signal == value
  [Symbol.toPrimitive]() { return this._.get() }
  valueOf() { return this._.get() }
  // the beauty of previous APIs (libraries or standard)
  peek() { return untrack(() => this._.get()) }
  toJSON() { return untrack(() => this._.get()) }
}

class Computed extends Signal {
  get value() { return this._.get() }
}

class State extends Signal {
  get value() { return this._.get() }
  set value(value) { this._.set(value) }
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
