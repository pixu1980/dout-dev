// Image utilities: resolve asset paths and read PNG/JPEG dimensions
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const srcDir = join(projectRoot, 'src');

export function resolveAssetPathFromHref(href) {
  if (!href) return null;
  const s = String(href).trim();
  if (!s) return null;
  // Root absolute like /assets/... or /./assets/...
  if (s.startsWith('/')) {
    const cleaned = s.replace(/^\/+\.(?=\/)/, '/'); // "/./assets" -> "/assets"
    return join(srcDir, cleaned.replace(/^\//, ''));
  }
  // Common pattern in posts: "../assets/..." (relative to src/posts)
  if (s.startsWith('../assets/')) {
    return join(srcDir, s.replace(/^\.\.\//, ''));
  }
  // Fallback: treat as under src
  return join(srcDir, s.replace(/^\.\/?/, ''));
}

function parsePngSize(buf) {
  if (buf.length < 24) return null;
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return width && height ? { width, height } : null;
}

function parseJpegSize(buf) {
  if (buf.length <= 2 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    // Standalone markers
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const length = buf.readUInt16BE(offset + 2);
    // SOF0..SOF15 (except DHT/DAC etc). Baseline SOF0=0xC0, SOF2=0xC2
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      const precision = buf[offset + 4];
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      if (width && height && precision) return { width, height };
    }
    offset += 2 + length;
  }
  return null;
}

export async function readImageSize(absPath) {
  try {
    const buf = await readFile(absPath);
    return parsePngSize(buf) || parseJpegSize(buf) || null;
  } catch {
    return null;
  }
}

export function readImageSizeSync(absPath) {
  try {
    const buf = readFileSync(absPath);
    return parsePngSize(buf) || parseJpegSize(buf) || null;
  } catch {
    return null;
  }
}

export function isLikelyImage(href) {
  return /\.(png|jpe?g|webp)$/i.test(String(href || ''));
}

export { srcDir, projectRoot };
