const { fromCharCode } = String;

const te = new TextEncoder;
const td = new TextDecoder;

export const text = {
  encode: value => te.encode(value),
  decode: value => td.decode(value),
};

export { fromCharCode };
