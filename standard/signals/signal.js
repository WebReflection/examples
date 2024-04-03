import { Signal as $Signal } from 'signal-polyfill';
import { effect } from './effect.js';
// ONE DAY // const { Signal: $Signal } = globalThis;

const { Computed: C, State: S, subtle: { untrack } } = $Signal;

export { effect, untrack };

export const value = Symbol('value');

// for `instanceof Signal` operations (aka: isSignal)
export class Signal {
  constructor(_) { this[value] = _ }
  [Symbol.toPrimitive]() { return this[value].get() }
  valueOf() { return this[value].get() }
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

export const computed = (callback, ...rest) => new Computed(new C(callback, ...rest));

export const signal = (value, ...rest) => new State(new S(value, ...rest));
