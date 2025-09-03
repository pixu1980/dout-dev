// Post Processor: clean single function to transform markdown into post object
import matter from 'gray-matter';
import { marked } from 'marked';
import { createMarkedOptions } from './marked-syntax.js';
import { slugify } from './utils.js';
import { resolveAssetPathFromHref, readImageSizeSync } from './image-utils.js';

/**
 * Converts a markdown file (with front-matter) into a normalized post object
 * @param {string} filePath file path (used for slug and inferred date)
 * @param {string} raw raw file content
 * @returns {object} normalized post
 */
function readCoverSize(data) {
  const href = data.coverImage || data.cover_image;
  if (!href) return null;
  const abs = resolveAssetPathFromHref(href);
  const size = abs ? readImageSizeSync(abs) : null;
  return size?.width && size?.height ? size : null;
}

export function processMarkdown(filePath, raw) {
  const { data, content } = matter(raw);
  const slug = filePath.split('/').pop().replace(/\.md$/i, '');
  const title = data.title || inferTitle(slug);
  const date = pickDate(data.date, slug);
  const published = data.published !== false;
  const tagList = normalizeTags(data.tags).map((t) => ({ key: t, label: capitalize(t) }));
  const html = marked(content, createMarkedOptions());
  // Determine cover dimensions if coverImage points to a local asset
  const coverSize = readCoverSize(data);
  return {
    name: slug,
    title,
    date: date ? date.toISOString() : null,
    dateString: date ? date.toDateString() : null,
    published,
    tags: tagList,
    series: data.series || null,
    excerpt: buildExcerpt(content),
    content: html,
    // Cover image support (M4)
  coverImage: data.coverImage || data.cover_image || null,
  coverWidth: coverSize?.width,
  coverHeight: coverSize?.height,
    coverAlt: data.coverAlt || data.cover_alt || title,
    coverTitle: data.coverTitle || data.cover_title || undefined,
    pinned: !!data.pinned,
    layout: data.layout || 'post',
  };
}

function pickDate(frontDate, slug) {
  const explicit = normalizeDate(frontDate);
  if (explicit) return explicit;
  const inferred = inferDateFromSlug(slug);
  return inferred;
}
function inferTitle(slug) {
  return slug
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
function normalizeDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}
function inferDateFromSlug(slug) {
  const m = slug.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? normalizeDate(m[1]) : null;
}
function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => slugify(String(t)));
  return String(tags)
    .split(',')
    .map((t) => slugify(t))
    .filter(Boolean);
}
function buildExcerpt(md) {
  const first = md.split(/\n\n+/)[0];
  return first
  // biome-ignore lint/complexity/noUselessEscapeInRegex: '[' and ']' need escaping inside character classes
  .replace(/[>#*`~_()\[\]-]/g, '') // Remove markdown symbols
    .replace(/\[[^\]]*\]\([^)]*\)/g, '') // Remove complete links [text](url)
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .slice(0, 180)
    .trim();
}
function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
