#!/usr/bin/env node
/**
 * Image pipeline: generate responsive variants and WebP format
 * - scans src/assets/images (jpg/png)
 * - outputs resized JPEG/PNG variants and .webp next to original
 * - produces a manifest mapping for each original -> variants
 */
import { existsSync } from 'node:fs';
import { mkdir, readdir, stat, writeFile, readFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { resolveConfig } from './_config.js';
import { buildOgImages } from './_og-image-generator.js';
import { scanContent } from './_scan.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const srcDir = join(projectRoot, 'src');
const IMG_ROOT = join(srcDir, 'assets', 'images');
const MANIFEST_PATH = join(srcDir, 'assets', 'images-manifest.json');

const SIZES = [320, 640, 960, 1280];
const QUALITY_JPEG = 78;
const QUALITY_WEBP = 80;

async function ensureDir(dir) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

function isProcessable(path) {
  const ext = extname(path).toLowerCase();
  return ext === '.jpg' || ext === '.jpeg' || ext === '.png';
}

function isGeneratedVariant(path) {
  const ext = extname(path).toLowerCase();
  const stem = basename(path, ext);
  const parts = stem.split('-');
  if (parts.length < 2) return false;

  const suffixes = [];
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    if (!/^\d+$/.test(parts[i])) break;
    suffixes.unshift(parts[i]);
  }

  return suffixes.length > 0 && suffixes.every((value) => SIZES.includes(Number(value)));
}

async function* walk(dir) {
  const entries = await readdir(dir);
  for (const name of entries) {
    const full = join(dir, name);
    const st = await stat(full);
    if (st.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

function relFromSrc(abs) {
  return abs.replace(`${srcDir}/`, '');
}

function makeVariantPath(dir, base, w, ext) {
  return join(dir, `${base}-${w}${ext}`);
}

async function writeVariant(absPath, outPath, w, ext) {
  const pipeline = sharp(absPath).resize({ width: w, withoutEnlargement: true });
  if (ext === '.png') {
    await pipeline.png({ compressionLevel: 9 }).toFile(outPath);
  } else {
    await pipeline.jpeg({ quality: QUALITY_JPEG, mozjpeg: true }).toFile(outPath);
  }
}

async function tryAutoRepairPlaceholder(absPath) {
  try {
    const buf = await readFile(absPath);
    const isTiny = buf.length < 256;
    const text = buf.toString('utf8').trim();
    const isText = /^placeholder/i.test(text) || /^[A-Za-z0-9\s._-]+$/.test(text);
    if (!(isTiny || isText)) return false;
    console.warn('🛠️  Auto-replacing placeholder with generated JPEG:', relFromSrc(absPath));
    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#d1d5db"/><text x="50%" y="50%" font-family="Arial, Helvetica, sans-serif" font-size="48" text-anchor="middle" fill="#374151">placeholder</text></svg>`;
    await sharp(Buffer.from(svg)).jpeg({ quality: QUALITY_JPEG, mozjpeg: true }).toFile(absPath);
    return true;
  } catch {
    return false;
  }
}

async function processImage(absPath) {
  const ext = extname(absPath).toLowerCase();
  const base = basename(absPath, ext);
  const dir = dirname(absPath);
  await ensureDir(dir);

  let meta;
  try {
    const image = sharp(absPath, { failOn: 'none' });
    meta = await image.metadata();
  } catch (e) {
    const repaired = await tryAutoRepairPlaceholder(absPath);
    if (repaired) {
      meta = await sharp(absPath, { failOn: 'none' }).metadata();
    } else {
      const err = new Error(`Unsupported or unreadable image: ${absPath} -> ${e?.message || e}`);
      err.cause = e;
      throw err;
    }
  }

  const entries = [];
  entries.push(...(await generateRasterVariants(absPath, dir, base, ext, meta)));
  entries.push(...(await generateWebpVariants(absPath, dir, base, meta)));
  return entries;
}

async function generateRasterVariants(absPath, dir, base, ext, meta) {
  const out = [];
  for (const w of SIZES) {
    if (meta.width && meta.width < w) continue;
    const outPath = makeVariantPath(dir, base, w, ext);
    if (!existsSync(outPath)) {
      await writeVariant(absPath, outPath, w, ext);
    }
    out.push(relFromSrc(outPath));
  }
  return out;
}

async function generateWebpVariants(absPath, dir, base, meta) {
  const out = [];
  const webpBase = join(dir, `${base}.webp`);
  if (!existsSync(webpBase)) {
    await sharp(absPath).webp({ quality: QUALITY_WEBP }).toFile(webpBase);
  }
  out.push(relFromSrc(webpBase));
  for (const w of SIZES) {
    if (meta.width && meta.width < w) continue;
    const outName = `${base}-${w}.webp`;
    const outPath = join(dir, outName);
    if (!existsSync(outPath)) {
      await sharp(absPath)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: QUALITY_WEBP })
        .toFile(outPath);
    }
    out.push(relFromSrc(outPath));
  }
  return out;
}

async function buildManifest() {
  if (!existsSync(IMG_ROOT)) return {};
  const manifest = {};
  for await (const file of walk(IMG_ROOT)) {
    if (!isProcessable(file) || isGeneratedVariant(file)) continue;
    const rel = relFromSrc(file);
    try {
      const variants = await processImage(file);
      manifest[rel] = variants;
    } catch (e) {
      console.warn('⚠️  Skipping image due to processing error:', rel, '-', e.message);
    }
  }
  await ensureDir(dirname(MANIFEST_PATH));
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  return manifest;
}

async function main() {
  try {
    console.log('🖼️  Generating responsive image variants...');
    const manifest = await buildManifest();
    console.log('✅ Image manifest written:', MANIFEST_PATH);
    console.log('   Entries:', Object.keys(manifest).length);
    const config = resolveConfig();
    const dataset = scanContent(config);
    const ogManifest = await buildOgImages({ dataset, config });
    console.log('✅ OG image manifest written:', ogManifest.manifestPath);
    console.log('   Entries:', Object.keys(ogManifest.entries).length);
    process.exit(0);
  } catch (err) {
    console.error('❌ Image pipeline failed:', err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { buildManifest };
