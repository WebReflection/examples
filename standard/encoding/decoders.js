//@ts-check

/*! (c) Andrea Giammarchi - MIT */

// const td = new TextDecoder;

// /**
//  * @param {Uint8Array} view
//  * @returns
//  */
// export const directUTF8View = view => td.decode(view);



// const MAX_ARGS = 0xF000;
// const { fromCharCode } = String;
// const asUTF16String = codes => fromCharCode.apply(null, codes);

// /**
//  * @param {Uint16Array} view
//  * @returns
//  */
// export const directUTF16View = view => {
//   let value = '';
//   for (let i = 0, length = view.length; i < length; i += MAX_ARGS)
//     value += asUTF16String(view.subarray(i, i + MAX_ARGS));
//   return value;
// };

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const td = new TextDecoder;

/**
 * @param {Uint8Array} view
 * @returns
 */
export const bufferedUTF8View = view => td.decode(view);



const MAX_ARGS = 0xF000;
const { fromCharCode } = String;
const asUTF16String = codes => fromCharCode.apply(null, codes);

/**
 * @param {Uint8Array} view
 * @returns
 */
export const bufferedUTF16View = view => {
    let value = '';
    for (let i = 0, length = view.length; i < length; i += MAX_ARGS)
      value += asUTF16String(view.subarray(i, i + MAX_ARGS));
    return value;
  };



/**
 * @param {Uint8Array} view
 * @returns
 */
export const dataUTF16View = view => {
  const data = new DataView(view.buffer);
  const length = view.length;
  const codes = [];
  let value = '';
  for (let i = 0; i < length; i += 2) {
    if (0 < i && (i % MAX_ARGS) === 0)
      value += asUTF16String(codes.splice(0));
    codes.push(data.getUint16(i, true));
  }
  value += asUTF16String(codes);
  return value;
};
