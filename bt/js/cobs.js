// (c) https://github.com/LEGO/spike-prime-docs/blob/main/examples/python/cobs.py

const DELIMITER = 0x02;
const NO_DELIMITER = 0xFF;
const COBS_CODE_OFFSET = DELIMITER;
const MAX_BLOCK_SIZE = 84;
const XOR = 3;

const begin_block = buffer => [buffer.push(NO_DELIMITER) - 1, 1];

const encode = data => {
  const buffer = [];
  const begin_block = () => {
    code_index = buffer.length
    buffer.push(NO_DELIMITER);
    block = 1
  };
  let code_index = 0, block = 0;
  begin_block();
  for (const byte of data) {
    if (byte > DELIMITER) {
      buffer.push(byte);
      block++;
    }
    if (byte <= DELIMITER || block > MAX_BLOCK_SIZE) {
      if (byte <= DELIMITER) {
        const delimiter_base = byte * MAX_BLOCK_SIZE;
        const block_offset = block + COBS_CODE_OFFSET;
        buffer[code_index] = delimiter_base + block_offset;
      }
      begin_block();
    }
  }
  buffer[code_index] = block + COBS_CODE_OFFSET;
  return buffer;
};

export const pack = data => {
  const buffer = encode(data);
  for (let i = 0; i < buffer.length; i++)
    buffer[i] ^= XOR;
  buffer.push(DELIMITER);
  return new Uint8Array(buffer);
};

const divmod = (dividend, divisor) => [
  (dividend / divisor) >>> 0,
  dividend % divisor
];

const decode = data => {
  const buffer = [];
  const unescape = code => {
    if (code === 0xFF)
      return [null, MAX_BLOCK_SIZE + 1];
    let [value, block] = divmod(code - COBS_CODE_OFFSET, MAX_BLOCK_SIZE);
    if (block === 0) {
      block = MAX_BLOCK_SIZE
      value--;
    }
    return [value, block];
  };
  let [value, block] = unescape(data[0]);
  for (let i = 1; i < data.length; i++) {
    const byte = data[i];
    block--;
    if (block > 0) {
      buffer.push(byte);
      continue;
    }
    if (value !== null) buffer.push(value);
    [value, block] = unescape(byte);
  }
  return buffer;
};

export const unpack = frame => {
  const start = frame[0] === 0x01 ? 1 : 0;
  const unframed = frame.slice(start, -1).map(c => c ^ XOR);
  return new Uint8Array(decode(unframed));
};
