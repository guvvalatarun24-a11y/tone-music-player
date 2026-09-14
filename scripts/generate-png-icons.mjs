import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height) {
  // Simple uncompressed or deflated RGBA PNG generator
  const rawBytes = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawBytes[offset++] = 0; // Filter type: None
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      // Gradient background: Dark Slate (#0f172a to #1e1b4b)
      let r = Math.floor(15 + (30 - 15) * nx);
      let g = Math.floor(23 + (27 - 23) * ny);
      let b = Math.floor(42 + (75 - 42) * (nx + ny) * 0.5);

      // Distance from center
      const dx = (x - width / 2) / (width / 2);
      const dy = (y - height / 2) / (height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Outer ring
      if (dist > 0.68 && dist < 0.72) {
        r = Math.floor(r * 0.4 + 16 * 0.6);
        g = Math.floor(g * 0.4 + 185 * 0.6);
        b = Math.floor(b * 0.4 + 129 * 0.6);
      }

      // Center music/shuffle accent zone
      if (dist <= 0.45) {
        // Bright emerald to cyan gradient
        const t = (nx + ny) * 0.5;
        const acR = 16 + (6 - 16) * t;
        const acG = 185 + (182 - 185) * t;
        const acB = 129 + (212 - 129) * t;
        const intensity = 0.85 * (1 - dist / 0.45);
        r = Math.floor(r * (1 - intensity) + acR * intensity);
        g = Math.floor(g * (1 - intensity) + acG * intensity);
        b = Math.floor(b * (1 - intensity) + acB * intensity);
      }

      rawBytes[offset++] = Math.min(255, Math.max(0, r));
      rawBytes[offset++] = Math.min(255, Math.max(0, g));
      rawBytes[offset++] = Math.min(255, Math.max(0, b));
      rawBytes[offset++] = 255; // Alpha
    }
  }

  const deflated = zlib.deflateSync(rawBytes);

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', deflated);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPNG(512, 512));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180));
fs.writeFileSync('public/favicon.ico', createPNG(64, 64));

console.log('PNG icons generated successfully!');
