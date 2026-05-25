#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { resolveConfig } from './_config.js';
import { scanContent } from './_scan.js';

const OG_OUTPUT_DIR = join(process.cwd(), 'src', 'assets', 'og');
const RENDER_VERSION = 3;
const OG_SOCIAL_SIZE = { width: 1200, height: 630 };
const OG_CARD_SIZE = { width: 1200, height: 900 };
const EYEBROW_PILL = { x: 128, y: 118, width: 260, height: 42 };
const ARCHIVE_DESCRIPTION_SUFFIX = 'Follow related posts across the full archive.';

const KIND_FOLDERS = {
  page: 'pages',
  post: 'posts',
  tag: 'tags',
  month: 'months',
  series: 'series',
};

const KIND_STYLES = {
  page: { accent: '#ff6b3d', badge: 'Page', soft: '#ffd0bf' },
  post: { accent: '#ff6b3d', badge: 'Article', soft: '#ffe1d5' },
  tag: { accent: '#2f8fd8', badge: 'Topic', soft: '#cfeaff' },
  month: { accent: '#2d9f87', badge: 'Month archive', soft: '#c9f0e6' },
  series: { accent: '#d95b7e', badge: 'Series', soft: '#ffd2de' },
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

function normalizePlainText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function ensureSentence(value) {
  const text = normalizePlainText(value);
  if (!text) return '';

  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function appendArchiveDescription(value) {
  const sentence = ensureSentence(value);
  return sentence ? `${sentence} ${ARCHIVE_DESCRIPTION_SUFFIX}` : ARCHIVE_DESCRIPTION_SUFFIX;
}

function getFirstH2Text(post) {
  const firstH2 = post?.toc?.find((item) => item?.level === 2 && item?.text);
  return normalizePlainText(firstH2?.text);
}

function getPostDescriptionSegments(post, fallbackDescription) {
  const description = normalizePlainText(post?.description);
  const firstH2 = getFirstH2Text(post);

  if (description && firstH2) return [description, firstH2];
  if (description) return [description];

  return [normalizePlainText(post?.excerpt || fallbackDescription)].filter(Boolean);
}

function wrapSegmentedLines(segments, maxChars, maxLines) {
  const cleanSegments = segments.map(normalizePlainText).filter(Boolean);
  const lines = [];

  for (const [index, segment] of cleanSegments.entries()) {
    const remainingSegments = cleanSegments.length - index - 1;
    const availableLines = maxLines - lines.length;
    if (availableLines <= 0) break;

    const segmentLineLimit = Math.max(1, availableLines - remainingSegments);
    lines.push(...wrapLines(segment, maxChars, segmentLineLimit));
  }

  return lines.slice(0, maxLines);
}

function getDescriptionLines(entry, fallbackDescription) {
  if (Array.isArray(entry.descriptionSegments) && entry.descriptionSegments.length) {
    return wrapSegmentedLines(entry.descriptionSegments, 50, 3);
  }

  return wrapLines(entry.description || fallbackDescription, 50, 3);
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

function getOgFallbackImagePath(kind, slug) {
  const folder = KIND_FOLDERS[kind] || KIND_FOLDERS.page;
  const safeSlug = normalizeSlug(slug);
  return `/assets/og/${folder}/${safeSlug}-card.png`;
}

function getOgImageSvgPath(kind, slug) {
  const folder = KIND_FOLDERS[kind] || KIND_FOLDERS.page;
  const safeSlug = normalizeSlug(slug);
  return `/assets/og/${folder}/${safeSlug}.svg`;
}

function getOgFallbackImageSvgPath(kind, slug) {
  const folder = KIND_FOLDERS[kind] || KIND_FOLDERS.page;
  const safeSlug = normalizeSlug(slug);
  return `/assets/og/${folder}/${safeSlug}-card.svg`;
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
    ...posts.map((post) => {
      const descriptionSegments = getPostDescriptionSegments(post, site.description);

      return {
        key: `post:${post.name}`,
        kind: 'post',
        slug: post.name,
        eyebrow: site.title || 'dout.dev',
        title: post.title || post.name,
        description: descriptionSegments.join('\n'),
        descriptionSegments,
      };
    }),
    ...tags.map((tag) => ({
      key: `tag:${tag.slug || tag.key}`,
      kind: 'tag',
      slug: tag.slug || tag.key,
      eyebrow: 'Topic archive',
      title: tag.label || tag.name || tag.key,
      description: appendArchiveDescription(
        `Posts tagged with ${tag.label || tag.name || tag.key}.`
      ),
    })),
    ...months.map((month) => ({
      key: `month:${month.slug || month.key}`,
      kind: 'month',
      slug: month.slug || month.key,
      eyebrow: 'Monthly archive',
      title: month.label || month.name || month.key,
      description: appendArchiveDescription(
        `Everything published in ${month.label || month.name || month.key}.`
      ),
    })),
    ...series.map((entry) => ({
      key: `series:${entry.slug}`,
      kind: 'series',
      slug: entry.slug,
      eyebrow: 'Series',
      title: entry.title,
      description: appendArchiveDescription(
        entry.description || `A series of posts about ${entry.title}.`
      ),
    })),
  ];
}

function renderOgSvg(entry, config, size = OG_SOCIAL_SIZE) {
  const site = config?.SITE_META || {};
  const style = KIND_STYLES[entry.kind] || KIND_STYLES.page;
  const { width, height } = size;
  const isCard = height > OG_SOCIAL_SIZE.height;
  const panelHeight = height - 128;
  const titleY = isCard ? 320 : 252;
  const descriptionY = isCard ? 574 : 446;
  const footerY = height - 110;
  const titleLines = wrapLines(entry.title, 25, 3);
  const descriptionLines = getDescriptionLines(entry, site.description);
  const masthead = `${site.title || 'dout.dev'} / EDITORIAL`;

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="paperTexture" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="17" result="noise" />
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.52 0 0 0 0 0.48 0 0 0 0 0.42 0 0 0 0.08 0" />
      <feBlend in="SourceGraphic" mode="multiply" />
    </filter>
    <linearGradient id="paper" x1="0" y1="0" x2="${width}" y2="${height}" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F6EFE2" />
      <stop offset="0.56" stop-color="#ECE2D1" />
      <stop offset="1" stop-color="#15110F" />
    </linearGradient>
    <linearGradient id="accentSweep" x1="72" y1="${height - 110}" x2="1128" y2="120" gradientUnits="userSpaceOnUse">
      <stop stop-color="${style.accent}" />
      <stop offset="0.48" stop-color="${style.soft}" />
      <stop offset="1" stop-color="#111111" />
    </linearGradient>
    <pattern id="dotGrid" width="24" height="24" patternUnits="userSpaceOnUse">
      <rect x="3" y="3" width="2" height="2" fill="#16120F" fill-opacity="0.16" />
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#paper)" filter="url(#paperTexture)" />
  <rect width="${width}" height="${height}" fill="url(#dotGrid)" />
  <path d="M0 ${height} L${width} ${Math.round(height * 0.72)} L${width} ${height} Z" fill="url(#accentSweep)" opacity="0.34" />
  <path d="M0 ${Math.round(height * 0.16)} L${width} 0 L${width} 96 L0 ${Math.round(height * 0.34)} Z" fill="${style.accent}" opacity="0.16" />
  <rect x="64" y="64" width="1072" height="${panelHeight}" rx="28" fill="#111111" stroke="#FFFFFF" stroke-opacity="0.18" />
  <rect x="92" y="92" width="1016" height="${panelHeight - 56}" rx="18" fill="#1A1714" stroke="${style.accent}" stroke-opacity="0.45" />
  <rect x="92" y="92" width="18" height="${panelHeight - 56}" rx="9" fill="${style.accent}" />
  <rect x="${EYEBROW_PILL.x}" y="${EYEBROW_PILL.y}" width="${EYEBROW_PILL.width}" height="${EYEBROW_PILL.height}" rx="${EYEBROW_PILL.height / 2}" ry="${EYEBROW_PILL.height / 2}" fill="${style.accent}" fill-opacity="0.16" />
  <text x="150" y="145" fill="#F7F0E8" font-family="Avenir Next, Segoe UI, Helvetica, Arial, sans-serif" font-size="19" font-weight="800" letter-spacing="0.08em">${escapeXml((entry.eyebrow || style.badge).toUpperCase())}</text>
  <text x="998" y="${isCard ? 736 : 548}" text-anchor="middle" fill="#FFFFFF" fill-opacity="0.05" font-family="Georgia, Times New Roman, serif" font-size="${isCard ? 176 : 150}" font-weight="700" letter-spacing="0">DOUT</text>
  ${buildTextBlock(
    titleLines,
    138,
    titleY,
    82,
    'fill="#FFF8F0" font-family="Georgia, Times New Roman, serif" font-size="70" font-weight="700" letter-spacing="0"'
  )}
  ${buildTextBlock(
    descriptionLines,
    142,
    descriptionY,
    38,
    'fill="#D7CFC4" font-family="Avenir Next, Segoe UI, Helvetica, Arial, sans-serif" font-size="28" font-weight="500" letter-spacing="0"'
  )}
  <rect x="128" y="${footerY - 24}" width="210" height="2" fill="${style.accent}" />
  <text x="128" y="${footerY}" fill="#F7F0E8" font-family="Avenir Next, Segoe UI, Helvetica, Arial, sans-serif" font-size="23" font-weight="800" letter-spacing="0.04em">${escapeXml(masthead.toUpperCase())}</text>
  <text x="1052" y="${footerY}" text-anchor="end" fill="#BDB3A7" font-family="Avenir Next, Segoe UI, Helvetica, Arial, sans-serif" font-size="20" font-weight="600" letter-spacing="0">${escapeXml(site.url || 'https://dout.dev')}</text>
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
        descriptionSegments: entry.descriptionSegments || [],
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

  const output = {
    pngPath: getOgImagePath(entry.kind, entry.slug),
    svgPath: getOgImageSvgPath(entry.kind, entry.slug),
  };

  if (entry.kind === 'post') {
    const fallbackSvgPath = join(
      outputDir,
      getRelativeOgAssetPath(getOgFallbackImageSvgPath(entry.kind, entry.slug))
    );
    const fallbackPngPath = join(
      outputDir,
      getRelativeOgAssetPath(getOgFallbackImagePath(entry.kind, entry.slug))
    );
    await ensureDir(dirname(fallbackSvgPath));
    const fallbackSvg = renderOgSvg(entry, config, OG_CARD_SIZE);
    await writeFile(fallbackSvgPath, fallbackSvg, 'utf8');
    await sharp(Buffer.from(fallbackSvg))
      .png({ compressionLevel: 9, quality: 100 })
      .toFile(fallbackPngPath);

    output.fallbackPngPath = getOgFallbackImagePath(entry.kind, entry.slug);
    output.fallbackSvgPath = getOgFallbackImageSvgPath(entry.kind, entry.slug);
  }

  return output;
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
    const fallbackPngPath =
      entry.kind === 'post'
        ? join(outputDir, getRelativeOgAssetPath(getOgFallbackImagePath(entry.kind, entry.slug)))
        : null;
    const fallbackSvgPath =
      entry.kind === 'post'
        ? join(outputDir, getRelativeOgAssetPath(getOgFallbackImageSvgPath(entry.kind, entry.slug)))
        : null;
    const previousEntry = previousManifest.entries?.[entry.key];
    const fallbackIsCurrent =
      entry.kind !== 'post' ||
      (previousEntry?.fallbackPngPath &&
        previousEntry?.fallbackSvgPath &&
        fallbackPngPath &&
        fallbackSvgPath &&
        existsSync(fallbackPngPath) &&
        existsSync(fallbackSvgPath));

    let output;
    if (
      previousEntry?.hash === hash &&
      existsSync(pngPath) &&
      existsSync(svgPath) &&
      previousEntry?.pngPath &&
      previousEntry?.svgPath &&
      fallbackIsCurrent
    ) {
      output = {
        pngPath: previousEntry.pngPath,
        svgPath: previousEntry.svgPath,
        fallbackPngPath: previousEntry.fallbackPngPath,
        fallbackSvgPath: previousEntry.fallbackSvgPath,
      };
    } else {
      output = await writeImagePair(entry, resolvedConfig, outputDir);
    }

    referencedFiles.add(pngPath);
    referencedFiles.add(svgPath);
    if (fallbackPngPath) referencedFiles.add(fallbackPngPath);
    if (fallbackSvgPath) referencedFiles.add(fallbackSvgPath);

    manifest.entries[entry.key] = {
      kind: entry.kind,
      slug: entry.slug,
      hash,
      pngPath: output.pngPath,
      svgPath: output.svgPath,
      ...(output.fallbackPngPath
        ? { fallbackPngPath: output.fallbackPngPath, fallbackSvgPath: output.fallbackSvgPath }
        : {}),
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

export { getOgFallbackImagePath, getOgImagePath };
