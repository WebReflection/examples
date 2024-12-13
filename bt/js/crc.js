const table = new Uint32Array(256);
for (let c, j, i = 0; i < 256; i++) {
  for (c = i, j = 0; j < 8; j++)
    c = ((c & 1) * 0xEDB88320) ^ (c >>> 1);
  table[i] = c;
}

// zlib.crc32(buf[, crc])
export const crc32 = (buf, crc = 0) => {
  crc = ~crc
  for (let i = 0; i < buf.length; i++)
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return ~crc >>> 0;
};

const clone = (buf, extra) => {
  const aligned = new Uint8Array(buf.length + extra);
  for (let i = 0; i < buf.length; i++) aligned[i] = buf[i];
  return aligned;
};

export const crc = (buf, crc = 0, align = 4) => {
  const remainder = buf.length % align;
  return crc32(remainder ? clone(buf, align - remainder) : buf, crc);
};
