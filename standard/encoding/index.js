import * as encoders from './encoders.js';
import * as decoders from './decoders.js';

const buffers = [new ArrayBuffer(0x1000000), new SharedArrayBuffer(0x1000000)];
const entries = Object.entries(encoders);//.sort((a, b) => -a[0].localeCompare(b[0]));

if (typeof gc !== 'function') globalThis.gc = () => {};

const delay = async ms => {
  gc();
  await new Promise($ => setTimeout($, ms));
  gc();
};

// console.log(
//   JSON.stringify(
//     decoders.dataUTF16View(
//       encoders.dataUTF16View('small 💩 string', new ArrayBuffer(30))
//     )
//   )
// );

for (const buffer of buffers) {
  const data = new DataView(buffer);
  const prefix = buffer === buffers[1] ? '[shared] ' : '';
  for (const i of [1, 10, 30, 0xFFFF]) {
    console.log(`%c${prefix}string length ${i * 15}`, 'font-weight:bold');
    for (const [name, method] of entries) {
      console.log(name);
      console.time('  • total');
      let test = '!👨‍👩‍👦 & 💩?'.repeat(i);
      let measure = '  • cold', result;
      console.time(measure);
      try {
        result = method(test, buffer, data);
      }
      catch ({ message }) {
        console.warn(message);
      }
      console.timeEnd(measure);
      if (!result) {
        console.timeEnd('  • total');
        continue;
      }
      test = '!👨‍👩‍👦 & 🤯?'.repeat(i);
      await delay(250);
      for (let i = 0; i < 10; i++)
        result = method(test, buffer, data);
      measure = '  • hot';
      console.time(measure);
      result = method(test, buffer, data);
      console.timeEnd(measure);
      console.timeEnd('  • total');
      console.assert(decoders[name](result) === test, `${name} failed at en/decoding`);
      console.log('  • bytes: ' + result.length);
      await delay(1000);
    }
    console.log('');
  }
}
