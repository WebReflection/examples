import { Signal } from "signal-polyfill";
// ONE DAY // const { Signal: $Signal } = globalThis;

const { Computed, subtle: { Watcher } } = Signal;

const watcher = new Watcher(() => {
  if (processPending) {
    processPending = false;
    queueMicrotask(pending);
  }
});

const pending = () => {
  processPending = true;
  for (const signal of watcher.getPending()) signal.get();
  watcher.watch();
};

let processPending = true;

export const effect = callback => {
  let result = null;
  const cleanup = drop => {
    if (typeof result === 'function') result();
    result = drop ? null : callback();
  };
  const computed = new Computed(cleanup);
  watcher.watch(computed);
  computed.get();
  return () => {
    watcher.unwatch(computed);
    cleanup(true);
  };
};
