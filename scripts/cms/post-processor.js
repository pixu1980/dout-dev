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
  const keywords = extractKeywords(`${title}\n${content}`);
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
    keywords,
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
  return (
    first
      // biome-ignore lint/complexity/noUselessEscapeInRegex: '[' and ']' need escaping inside character classes
      .replace(/[>#*`~_()\[\]-]/g, '') // Remove markdown symbols
      .replace(/\[[^\]]*\]\([^)]*\)/g, '') // Remove complete links [text](url)
      .replace(/\s+/g, ' ') // Normalize multiple spaces
      .slice(0, 180)
      .trim()
  );
}
function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Basic keyword extraction (en/it stopwords), frequency-based top terms
function extractKeywords(text) {
  const STOP = new Set([
    // English
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'if',
    'then',
    'else',
    'for',
    'to',
    'of',
    'in',
    'on',
    'at',
    'by',
    'with',
    'from',
    'as',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'this',
    'that',
    'these',
    'those',
    'it',
    'its',
    'into',
    'about',
    'over',
    'under',
    'after',
    'before',
    'between',
    'within',
    'without',
    'your',
    'you',
    'we',
    'they',
    'I',
    'me',
    'my',
    'our',
    'their',
    'them',
    'us',
    'not',
    'no',
    'yes',
    'do',
    'does',
    'did',
    'done',
    'can',
    'could',
    'should',
    'would',
    'will',
    'just',
    'also',
    'so',
    'than',
    'too',
    'very',
    'more',
    'most',
    'such',
    'any',
    'some',
    'each',
    'other',
    'only',
    'own',
    'same',
    'how',
    'when',
    'where',
    'why',
    'what',
    'which',
    'who',
    'whom',
    'because',
    // Italian
    'il',
    'lo',
    'la',
    'i',
    'gli',
    'le',
    'un',
    'uno',
    'una',
    'di',
    'a',
    'da',
    'in',
    'con',
    'su',
    'per',
    'tra',
    'fra',
    'che',
    'e',
    'o',
    'ma',
    'se',
    'all',
    'alla',
    'alle',
    'agli',
    'della',
    'delle',
    'degli',
    'dei',
    'del',
    'nel',
    'nella',
    'nelle',
    'negli',
    'nei',
    'sul',
    'sulla',
    'sulle',
    'sugli',
    'sui',
    'come',
    'piu',
    'meno',
    'molto',
    'poco',
    'troppo',
    'quasi',
    'sempre',
    'mai',
    'anche',
    'solo',
    'stesso',
    'stessa',
    'stessi',
    'stesse',
    'quello',
    'quella',
    'quelli',
    'quelle',
    'questo',
    'questa',
    'questi',
    'queste',
    'cui',
    'qual',
    'quale',
    'quali',
    'perche',
    'quando',
    'dove',
    'cosa',
    'chi',
    'noi',
    'voi',
    'loro',
  ]);
  const plain = String(text)
    // remove code fences and markdown links/images
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    // strip punctuation
    .replace(/[^a-zA-Z0-9àèéìòóùÀÈÉÌÒÓÙ\s]/g, ' ')
    .toLowerCase();
  const freq = new Map();
  for (const raw of plain.split(/\s+/)) {
    const w = raw.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    if (!w || w.length < 3 || STOP.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map((x) => x[0]);
}
