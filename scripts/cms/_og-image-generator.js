#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { resolveConfig } from './_config.js';
import { scanContent } from './_scan.js';

const OG_OUTPUT_DIR = join(process.cwd(), 'src', 'assets', 'og');
const RENDER_VERSION = 1;

const KIND_FOLDERS = {
  page: 'pages',
  post: 'posts',
  tag: 'tags',
  month: 'months',
  series: 'series',
};

const KIND_STYLES = {
  page: { accent: '#ff6b3d', badge: 'Page' },
  post: { accent: '#ff6b3d', badge: 'Article' },
  tag: { accent: '#4d9cf8', badge: 'Topic' },
  month: { accent: '#3ab79f', badge: 'Month archive' },
  series: { accent: '#f26d8f', badge: 'Series' },
};

const STATIC_PAGE_ENTRIES = [
  {
    key: 'page:home',
    kind: 'page',
    slug: 'home',
    eyebrow: 'dout.dev',
    title: 'A handcrafted frontend journal.',
    description:
      'Field notes on CSS, accessibility, design systems, and the mechanics of publishing a fast static site without the usual framework gloss.',
  },
  {
    key: 'page:archive',
    kind: 'page',
    slug: 'archive',
    eyebrow: 'Archive',
    title: 'The complete dout.dev archive.',
    description: 'Browse everything by month, by topic, or by longer-running series.',
  },
  {
    key: 'page:about',
    kind: 'page',
    slug: 'about',
    eyebrow: 'About',
    title: 'dout.dev is an editorial lab for frontend craft.',
    description:
      'The site is written from markdown, rendered through a custom CMS, and shaped around performance, accessibility, and a strong visual point of view.',
  },
  {
    key: 'page:accessibility',
    kind: 'page',
    slug: 'accessibility',
    eyebrow: 'Accessibility',
    title: 'Accessibility notes and practical checkpoints for dout.dev.',
    description:
      'A lightweight accessibility page that keeps the route stable while pointing back to the main site structure and content.',
  },
  {
    key: 'page:search',
    kind: 'page',
    slug: 'search',
    eyebrow: 'Search',
    title: 'Search across posts, tags, series, and monthly archives.',
    description: 'Fast, static, and entirely client-side search for the full dout.dev corpus.',
  },
  {
    key: 'page:privacy',
    kind: 'page',
    slug: 'privacy',
    eyebrow: 'Privacy',
    title: 'Page hits, local only by default, and easy to disable.',
    description:
      'A transparent privacy page covering local analytics, data retention, and opt-out controls.',
  },
  {
    key: 'page:playground',
    kind: 'page',
    slug: 'playground',
    eyebrow: 'Playground',
    title: 'Experiments, prototypes, and interface sketches.',
    description:
      'A scratch space for visual systems, interaction patterns, and editorial prototypes.',
  },
  {
    key: 'page:demo',
    kind: 'page',
    slug: 'demo',
    eyebrow: 'Legacy route',
    title: 'A compatibility page for older dout.dev demo links.',
    description:
      'The legacy demo route stays online for old links, bookmarks, and development checks without pretending to be the primary homepage.',
  },
  {
    key: 'page:offline',
    kind: 'page',
    slug: 'offline',
    eyebrow: 'Offline',
    title: 'The site is still readable, even offline.',
    description: 'A resilient fallback page for disconnected reading on dout.dev.',
  },
  {
    key: 'page:404',
    kind: 'page',
    slug: '404',
    eyebrow: 'Not found',
    title: 'That page does not exist.',
    description: 'A lightweight recovery path that points readers back into the published archive.',
  },
];

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeSlug(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function wrapLines(value, maxChars, maxLines) {
  const text = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return [];

  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars || current.length === 0) {
      current = next;
      continue;
    }

    lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  const consumedWords = lines.join(' ').split(' ').filter(Boolean).length;
  if (consumedWords < words.length && lines.length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.,;:!?-]*$/, '')}...`;
  }

  return lines.slice(0, maxLines);
}

function buildTextBlock(lines, x, y, lineHeight, extraAttrs = '') {
  if (!lines.length) return '';

  return [
    `<text x="${x}" y="${y}" ${extraAttrs}>`,
    ...lines.map((line, index) => {
      const dy = index === 0 ? 0 : lineHeight;
      return `<tspan x="${x}" dy="${dy}">${escapeXml(line)}</tspan>`;
    }),
    '</text>',
  ].join('');
}

function getOgImagePath(kind, slug) {
  const folder = KIND_FOLDERS[kind] || KIND_FOLDERS.page;
  const safeSlug = normalizeSlug(slug);
  return `/assets/og/${folder}/${safeSlug}.png`;
}

function getOgImageSvgPath(kind, slug) {
  const folder = KIND_FOLDERS[kind] || KIND_FOLDERS.page;
  const safeSlug = normalizeSlug(slug);
  return `/assets/og/${folder}/${safeSlug}.svg`;
}

function getRelativeOgAssetPath(assetPath) {
  return assetPath.replace(/^\/assets\/og\//, '');
}

function getOgEntries(dataset, config) {
  const site = config?.SITE_META || {};
  const posts = (dataset?.posts || []).filter((post) => post?.published);
  const tags = dataset?.tags || [];
  const months = dataset?.months || [];
  const series = dataset?.series || [];

  return [
    ...STATIC_PAGE_ENTRIES,
    ...posts.map((post) => ({
      key: `post:${post.name}`,
      kind: 'post',
      slug: post.name,
      eyebrow: site.title || 'dout.dev',
      title: post.title || post.name,
      description: post.excerpt || post.description || site.description,
    })),
    ...tags.map((tag) => ({
      key: `tag:${tag.slug || tag.key}`,
      kind: 'tag',
      slug: tag.slug || tag.key,
      eyebrow: 'Topic archive',
      title: tag.label || tag.name || tag.key,
      description: `Posts tagged with ${tag.label || tag.name || tag.key}.`,
    })),
    ...months.map((month) => ({
      key: `month:${month.slug || month.key}`,
      kind: 'month',
      slug: month.slug || month.key,
      eyebrow: 'Monthly archive',
      title: month.label || month.name || month.key,
      description: `Everything published in ${month.label || month.name || month.key}.`,
    })),
    ...series.map((entry) => ({
      key: `series:${entry.slug}`,
      kind: 'series',
      slug: entry.slug,
      eyebrow: 'Series',
      title: entry.title,
      description: entry.description || `A series of posts about ${entry.title}.`,
    })),
  ];
}

function renderOgSvg(entry, config) {
  const site = config?.SITE_META || {};
  const style = KIND_STYLES[entry.kind] || KIND_STYLES.page;
  const titleLines = wrapLines(entry.title, 24, 3);
  const descriptionLines = wrapLines(entry.description || site.description, 48, 3);

  return `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="98" y1="72" x2="1102" y2="558" gradientUnits="userSpaceOnUse">
      <stop stop-color="#08111E" />
      <stop offset="1" stop-color="#112743" />
    </linearGradient>
    <linearGradient id="glow" x1="178" y1="118" x2="1046" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="${style.accent}" stop-opacity="0.34" />
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#060B14" />
  <circle cx="1008" cy="104" r="214" fill="url(#glow)" />
  <rect x="72" y="72" width="1056" height="486" rx="34" fill="url(#bg)" stroke="#FFFFFF" stroke-opacity="0.18" />
  <rect x="72" y="72" width="10" height="486" rx="10" fill="${style.accent}" />
  <rect x="102" y="112" width="140" height="40" rx="999" fill="#FFFFFF" fill-opacity="0.08" />
  <text x="126" y="138" fill="#F5F7FA" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="0.12em">${escapeXml((entry.eyebrow || style.badge).toUpperCase())}</text>
  ${buildTextBlock(
    titleLines,
    118,
    246,
    86,
    'fill="#F8FBFF" font-family="Georgia, Times New Roman, serif" font-size="74" font-weight="700" letter-spacing="-0.04em"'
  )}
  ${buildTextBlock(
    descriptionLines,
    124,
    442,
    38,
    'fill="#B6C2D4" font-family="Helvetica, Arial, sans-serif" font-size="29" font-weight="400"'
  )}
  <text x="120" y="530" fill="#E5ECF5" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="700">${escapeXml(site.title || 'dout.dev')}</text>
  <text x="1048" y="530" text-anchor="end" fill="#B6C2D4" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="400">${escapeXml(site.url || 'https://dout.dev')}</text>
</svg>`.trimStart();
}

function createEntryHash(entry, config) {
  return createHash('sha1')
    .update(
      JSON.stringify({
        version: RENDER_VERSION,
        kind: entry.kind,
        slug: entry.slug,
        eyebrow: entry.eyebrow,
        title: entry.title,
        description: entry.description,
        siteTitle: config?.SITE_META?.title || '',
        siteUrl: config?.SITE_META?.url || '',
      })
    )
    .digest('hex');
}

async function ensureDir(dir) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

async function readPreviousManifest(manifestPath) {
  if (!existsSync(manifestPath)) return { entries: {} };

  try {
    const raw = await readFile(manifestPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { entries: {} };
  }
}

async function writeImagePair(entry, config, outputDir) {
  const svgPath = join(
    outputDir,
    getRelativeOgAssetPath(getOgImageSvgPath(entry.kind, entry.slug))
  );
  const pngPath = join(outputDir, getRelativeOgAssetPath(getOgImagePath(entry.kind, entry.slug)));
  await ensureDir(dirname(svgPath));

  const svg = renderOgSvg(entry, config);
  await writeFile(svgPath, svg, 'utf8');
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, quality: 100 }).toFile(pngPath);

  return {
    pngPath: getOgImagePath(entry.kind, entry.slug),
    svgPath: getOgImageSvgPath(entry.kind, entry.slug),
  };
}

async function walkFiles(dir) {
  if (!existsSync(dir)) return [];

  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

async function cleanupStaleFiles(outputDir, referencedFiles) {
  const existingFiles = await walkFiles(outputDir);
  await Promise.all(
    existingFiles
      .filter((file) => !referencedFiles.has(file))
      .map((file) => rm(file, { force: true }))
  );
}

export async function buildOgImages({ dataset, config, outputDir = OG_OUTPUT_DIR } = {}) {
  const resolvedConfig = resolveConfig(config || {});
  const sourceDataset = dataset || scanContent(resolvedConfig);
  const previousManifest = await readPreviousManifest(join(outputDir, 'manifest.json'));
  const entries = getOgEntries(sourceDataset, resolvedConfig);
  const manifest = {
    version: RENDER_VERSION,
    entries: {},
  };

  await ensureDir(outputDir);
  const referencedFiles = new Set([join(outputDir, 'manifest.json')]);

  for (const entry of entries) {
    const hash = createEntryHash(entry, resolvedConfig);
    const pngPath = join(outputDir, getRelativeOgAssetPath(getOgImagePath(entry.kind, entry.slug)));
    const svgPath = join(
      outputDir,
      getRelativeOgAssetPath(getOgImageSvgPath(entry.kind, entry.slug))
    );
    const previousEntry = previousManifest.entries?.[entry.key];

    let output;
    if (
      previousEntry?.hash === hash &&
      existsSync(pngPath) &&
      existsSync(svgPath) &&
      previousEntry?.pngPath &&
      previousEntry?.svgPath
    ) {
      output = {
        pngPath: previousEntry.pngPath,
        svgPath: previousEntry.svgPath,
      };
    } else {
      output = await writeImagePair(entry, resolvedConfig, outputDir);
    }

    referencedFiles.add(pngPath);
    referencedFiles.add(svgPath);

    manifest.entries[entry.key] = {
      kind: entry.kind,
      slug: entry.slug,
      hash,
      pngPath: output.pngPath,
      svgPath: output.svgPath,
    };
  }

  await cleanupStaleFiles(outputDir, referencedFiles);
  await writeFile(
    join(outputDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  return { ...manifest, manifestPath: join(outputDir, 'manifest.json') };
}

async function main() {
  try {
    const config = resolveConfig();
    const dataset = scanContent(config);
    const manifest = await buildOgImages({ dataset, config });
    console.log('✅ OG image manifest written:', manifest.manifestPath);
    console.log('   Entries:', Object.keys(manifest.entries).length);
    process.exit(0);
  } catch (error) {
    console.error('❌ OG image generation failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { getOgImagePath };
