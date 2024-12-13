// this module repeatedly parses the format string ...
import struct from 'https://esm.run/@aksel/structjs';

// so we add a format string based cache via a Map
const fr = new FinalizationRegistry(key => map.delete(key));
const map = new Map;

// when unknown, we store a WeakRef of the resulting object
// so that the format parsing happens once per GC cycle
const set = fmt => {
  const ref = struct(fmt);
  fr.register(ref, fmt);
  map.set(fmt, new WeakRef(ref));
  return ref;
};

// when we get it we try to reach the previously stored ref
const get = fmt => map.get(fmt)?.deref() || set(fmt);

// this way we can have faster utilities that would cache
// format string parsing out of the box:
export const calcsize = fmt => get(fmt).size;
export const pack = (fmt, ...values) => get(fmt).pack(...values);
export const unpack = (fmt, value) => get(fmt).unpack(value);
