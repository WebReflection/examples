// TODO: effect and batch to have an almost 1:1 @webreflection/signal

import { Signal as $Signal } from "signal-polyfill";

const { untrack } = $Signal.subtle;

export class Signal {
  /**
   * @param {$Signal.Computed | $Signal.State} signal
   */
  constructor(signal) {
    this._ = signal;
  }

  // IMPLICIT SUBSCRIPTION
  [Symbol.toPrimitive]() {
    return this._.get();
  }
  valueOf() {
    return this._.get();
  }

  // EXPLICIT NO SUBSCRIPTION
  peek() {
    return untrack(() => this._.get());
  }
  toJSON() {
    return untrack(() => this._.get());
  }
}

class Computed extends Signal {
  get value() {
    return this._.get();
  }
}

class State extends Signal {
  get value() {
    return this._.get();
  }
  set value(value) {
    this._.set(value);
  }
}

export const computed = (callback, ...rest) => new Computed(new $Signal.Computed(callback, ...rest));

export const signal = (value, ...rest) => new State(new $Signal.State(value, ...rest));

export { untrack };
