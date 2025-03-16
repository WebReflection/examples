//@ts-check

/*! (c) Andrea Giammarchi - MIT */

// const te = new TextEncoder;

// /**
//  * @param {string} str
//  * @returns
//  */
// export const directUTF8View = str => te.encode(str);



// /**
//  * @param {string} str
//  * @returns
//  */
// export const directUTF16View = str => {
//   const length = str.length;
//   const view = new Uint16Array(length);
//   for (let i = 0; i < length; i++)
//     view[i] = str.charCodeAt(i);
//   return view;
// };

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

const te = new TextEncoder;

/**
 * @param {string} str
 * @param {ArrayBuffer} buffer
 * @returns
 */
export const bufferedUTF8View = (str, buffer) => {
  const view = new Uint8Array(buffer);
  const { written } = te.encodeInto(str, view);
  return view.subarray(0, written);
};



/**
 * @param {string} str
 * @param {ArrayBuffer} buffer
 * @returns
 */
export const bufferedUTF16View = (str, buffer) => {
  const length = str.length;
  const view = new Uint16Array(buffer, 0, length);
  for (let i = 0; i < length; i++) view[i] = str.charCodeAt(i);
  return view;
};



/**
 * @param {string} str
 * @param {ArrayBuffer} buffer
 * @param {DataView} data
 * @returns
 */
export const dataUTF16View = (str, buffer, data) => {
  const length = str.length;
  for (let i = 0; i < length; i++)
    data.setUint16(i * 2, str.charCodeAt(i), true);
  return new Uint8Array(buffer, 0, length * 2);
};
