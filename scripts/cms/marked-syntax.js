// Marked configuration / custom renderer producing <pre is="pix-highlighter"> blocks
import { Renderer } from 'marked';
import {
  resolveAssetPathFromHref,
  readImageSizeSync,
  isLikelyImage,
  srcDir,
} from './image-utils.js';
import { existsSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

function escapeHtml(str) {
  // Don't accidentally transform objects into [object Object]; if not string leave as-is
  if (typeof str !== 'string') return `${str}`; // simple conversion
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function createMarkedOptions() {
  const renderer = new Renderer();
  // Local counter to generate unique ids for task list items
  let taskCounter = 0;
  // Lazy-load manifest once per options instance
  const manifestPath = join(srcDir, 'assets', 'images-manifest.json');
  const manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf-8'))
    : null;

  function relFromAbs(abs) {
    const p = String(abs);
    const prefix = `${srcDir}/`;
    return p.startsWith(prefix) ? p.slice(prefix.length) : p;
  }

  function prefixForHref(href) {
    const s = String(href || '');
    if (s.startsWith('/')) return '/';
    if (s.startsWith('../')) return '../';
    if (s.startsWith('./')) return './';
    return '';
  }

  function autoSrcsetFromManifest(href) {
    try {
      if (!manifest) return '';
      const abs = resolveAssetPathFromHref(href);
      if (!abs) return '';
      const rel = relFromAbs(abs); // e.g. assets/images/foo.jpg
      const variants = manifest[rel];
      if (!Array.isArray(variants) || variants.length === 0) return '';
      const baseExt = extname(String(href)).toLowerCase();
      const allowJpeg = baseExt === '.jpg' || baseExt === '.jpeg';
      const prefix = prefixForHref(href);
      const candidates = variants
        .filter((p) => {
          const e = extname(p).toLowerCase();
          return allowJpeg ? e === '.jpg' || e === '.jpeg' : e === baseExt;
        })
        .map((p) => {
          const m = /-(\d+)\.[a-z]+$/i.exec(p);
          const w = m ? m[1] : '';
          return w ? `${prefix}${p} ${w}w` : null;
        })
        .filter(Boolean);
      return candidates.length ? candidates.join(', ') : '';
    } catch {
      return '';
    }
  }

  function autoSrcsetForExt(href, extWanted) {
    try {
      if (!manifest) return '';
      const abs = resolveAssetPathFromHref(href);
      if (!abs) return '';
      const rel = relFromAbs(abs);
      const variants = manifest[rel];
      if (!Array.isArray(variants) || variants.length === 0) return '';
      const prefix = prefixForHref(href);
      const candidates = variants
        .filter((p) => extname(p).toLowerCase() === extWanted)
        .map((p) => {
          const m = /(-)(\d+)(\.[a-z]+)$/i.exec(p);
          const w = m ? m[2] : '';
          return w ? `${prefix}${p} ${w}w` : null;
        })
        .filter(Boolean);
      return candidates.length ? candidates.join(', ') : '';
    } catch {
      return '';
    }
  }

  function computeSrcsets(href, meta) {
    const baseExt = extname(String(href || '')).toLowerCase();
    const rasterType = baseExt === '.png' ? 'image/png' : 'image/jpeg';
    const rasterSrcset = meta.srcset || autoSrcsetFromManifest(href) || '';
    const webpSrcset = autoSrcsetForExt(href, '.webp');
    return { baseExt, rasterType, rasterSrcset, webpSrcset };
  }

  function renderEagerPicture({ src, alt, meta, sizeAttrs, titleAttr, href }) {
    const eagerAttrs = buildAttrsEager(meta, sizeAttrs, titleAttr);
    const { rasterType, rasterSrcset, webpSrcset } = computeSrcsets(href, meta);
    if (webpSrcset || rasterSrcset) {
      const webp = webpSrcset
        ? `<source type="image/webp" srcset="${escapeHtml(webpSrcset)}">`
        : '';
      const raster = rasterSrcset
        ? `<source type="${rasterType}" srcset="${escapeHtml(rasterSrcset)}">`
        : '';
      return `<picture>${webp}${raster}<img src="${src}" alt="${alt}"${eagerAttrs}${rasterSrcset ? ` srcset="${escapeHtml(rasterSrcset)}"` : ''} /></picture>`;
    }
    return `<img src="${src}" alt="${alt}"${eagerAttrs} />`;
  }

  function renderLazyPicture({ src, alt, meta, sizeAttrs, titleAttr, href }) {
    const lazyAttrs = buildAttrsLazy(meta, sizeAttrs, titleAttr);
    const { rasterType, rasterSrcset, webpSrcset } = computeSrcsets(href, meta);
    if (webpSrcset || rasterSrcset) {
      const sources = buildPictureSources({ rasterType, rasterSrcset, webpSrcset, lazy: true });
      const imgDataSrcset = rasterSrcset ? ` data-srcset="${escapeHtml(rasterSrcset)}"` : '';
      const picture = `<picture>${sources}<img data-src="${src}" alt="${alt}"${lazyAttrs}${imgDataSrcset} /></picture>`;
      const noscript = renderLazyNoscript({
        src,
        alt,
        rasterSrcset,
        sizes: meta.sizes,
        sizeAttrs,
        titleAttr,
      });
      return picture + noscript;
    }
    return renderLazyFallback({ src, alt, lazyAttrs, sizeAttrs, titleAttr });
  }

  function buildPictureSources({ rasterType, rasterSrcset, webpSrcset, lazy }) {
    const webp = webpSrcset
      ? `<source type="image/webp" ${lazy ? 'data-' : ''}srcset="${escapeHtml(webpSrcset)}">`
      : '';
    const raster = rasterSrcset
      ? `<source type="${rasterType}" ${lazy ? 'data-' : ''}srcset="${escapeHtml(rasterSrcset)}">`
      : '';
    return webp + raster;
  }

  function renderLazyFallback({ src, alt, lazyAttrs, sizeAttrs, titleAttr }) {
    return (
      `<img data-src="${src}" alt="${alt}"${lazyAttrs} />` +
      `<noscript><img src="${src}" alt="${alt}"${sizeAttrs}${titleAttr} /></noscript>`
    );
  }

  function renderLazyNoscript({ src, alt, rasterSrcset, sizes, sizeAttrs, titleAttr }) {
    const sizesAttr = sizes ? ` sizes="${escapeHtml(sizes)}"` : '';
    const srcsetAttr = rasterSrcset ? ` srcset="${escapeHtml(rasterSrcset)}"` : '';
    return `<noscript><img src="${src}" alt="${alt}"${srcsetAttr}${sizesAttr}${sizeAttrs}${titleAttr} /></noscript>`;
  }
  function parseTitleMeta(raw) {
    if (!raw || typeof raw !== 'string') return { title: undefined, meta: {} };
    const parts = raw
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return { title: undefined, meta: {} };
    const title = parts[0] || undefined;
    const meta = parts.slice(1).reduce((acc, seg) => {
      const eq = seg.indexOf('=');
      if (eq > 0) {
        const key = seg.slice(0, eq).trim().toLowerCase();
        const val = seg.slice(eq + 1).trim();
        if (key === 'srcset' || key === 'sizes' || key === 'loading' || key === 'priority')
          acc[key] = val;
      }
      return acc;
    }, {});
    return { title, meta };
  }

  function flagsFromMeta(meta) {
    const loading = (meta.loading || 'lazy').toLowerCase();
    const priority = (meta.priority || 'low').toLowerCase();
    const hasSrcset = typeof meta.srcset === 'string' && meta.srcset.length > 0;
    const hasSizes = typeof meta.sizes === 'string' && meta.sizes.length > 0;
    const eager = loading === 'eager' || priority === 'high';
    return { loading, priority, hasSrcset, hasSizes, eager };
  }

  function buildAttrsLazy(meta, sizeAttrs, titleAttr) {
    const { priority, hasSrcset, hasSizes } = flagsFromMeta(meta);
    const dataSrcsetAttr = hasSrcset ? ` data-srcset="${escapeHtml(meta.srcset)}"` : '';
    const dataSizesAttr = hasSizes ? ` data-sizes="${escapeHtml(meta.sizes)}"` : '';
    return ` loading="lazy" decoding="async" fetchpriority="${priority}"${dataSrcsetAttr}${dataSizesAttr}${sizeAttrs}${titleAttr}`;
  }

  function buildAttrsEager(meta, sizeAttrs, titleAttr) {
    const { loading, priority, hasSrcset, hasSizes } = flagsFromMeta(meta);
    const srcsetAttr = hasSrcset ? ` srcset="${escapeHtml(meta.srcset)}"` : '';
    const sizesAttr = hasSizes ? ` sizes="${escapeHtml(meta.sizes)}"` : '';
    return ` loading="${loading}" decoding="async" fetchpriority="${priority}"${srcsetAttr}${sizesAttr}${sizeAttrs}${titleAttr}`;
  }
  function normalizeImageArgs(args) {
    if (args.length === 1 && args[0] && typeof args[0] === 'object') {
      const token = args[0];
      return {
        href: token.href || token.src || '',
        title: token.title,
        text: token.text || token.alt || '',
      };
    }
    return { href: args[0], title: args[1], text: args[2] };
  }

  function getSizeAttrs(href) {
    try {
      if (!isLikelyImage(href)) return '';
      const abs = resolveAssetPathFromHref(href);
      if (!abs) return '';
      const size = readImageSizeSync(abs);
      if (size?.width && size?.height) return ` width="${size.width}" height="${size.height}"`;
    } catch {}
    return '';
  }
  // Robust override: some environments provide a token object instead of raw string.
  renderer.code = (code, infostring) => {
    const actualCode = typeof code === 'object' && code && 'text' in code ? code.text : code;
    const lang = (infostring || code?.lang || '').trim().split(/\s+/)[0] || '';
    const langAttr = lang ? ` data-lang="${lang}"` : '';
    return `<pre is="pix-highlighter"${langAttr}><code>${escapeHtml(actualCode)}</code></pre>`;
  };
  // Lazy images with noscript fallback
  renderer.image = (...args) => {
    const { href, title, text } = normalizeImageArgs(args);
    const src = escapeHtml(String(href || ''));
    const alt = escapeHtml(String(text || ''));
    const { title: cleanTitle, meta } = parseTitleMeta(title);
    const titleAttr = cleanTitle ? ` title="${escapeHtml(String(cleanTitle))}"` : '';
    // Try to add width/height to reduce CLS only for local images (PNG/JPEG/WEBP)
    const sizeAttrs = getSizeAttrs(href);
    // If no explicit srcset is provided, try to build it from the images-manifest
    if (!meta.srcset) {
      const auto = autoSrcsetFromManifest(href);
      if (auto) meta.srcset = auto;
    }
    const { eager } = flagsFromMeta(meta);
    if (eager) {
      return renderEagerPicture({ src, alt, meta, sizeAttrs, titleAttr, href });
    }
    return renderLazyPicture({ src, alt, meta, sizeAttrs, titleAttr, href });
  };
  // Support Marked's token-based list item API while keeping accessible task lists.
  renderer.listitem = function listitem(tokenOrText, task, checked) {
    if (tokenOrText && typeof tokenOrText === 'object' && 'type' in tokenOrText) {
      const token = tokenOrText;
      const parsed = this.parser.parse(token.tokens, !!token.loose).trim();

      if (token.task) {
        taskCounter += 1;
        const id = `md-task-${taskCounter}`;
        const aria = String(token.text || '')
          .replace(/\s+/g, ' ')
          .trim();
        const checkedAttr = token.checked ? ' checked' : '';
        const visual = parsed
          .replace(/^<p>([\s\S]*)<\/p>$/i, '$1')
          .replace(/^<input\b[^>]*type=(['"]?)checkbox\1[^>]*>\s*/i, '')
          .trim();
        return `<li class="task-list-item"><input type="checkbox" id="${id}" class="task-list-item-checkbox" disabled aria-label="${escapeHtml(aria)}"${checkedAttr} /><label for="${id}">${visual}</label></li>`;
      }

      return `<li>${parsed}</li>`;
    }

    if (task) {
      taskCounter += 1;
      const id = `md-task-${taskCounter}`;
      // Strip HTML to produce a compact aria-label; leave rich text in the visual label
      const aria = String(tokenOrText)
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      const checkedAttr = checked ? ' checked' : '';
      const visual = String(tokenOrText)
        .replace(/^<input\b[^>]*type=(['"]?)checkbox\1[^>]*>\s*/i, '')
        .trim();
      return `<li class="task-list-item"><input type="checkbox" id="${id}" class="task-list-item-checkbox" disabled aria-label="${escapeHtml(aria)}"${checkedAttr} /><label for="${id}">${visual}</label></li>`;
    }
    return `<li>${tokenOrText}</li>`;
  };
  return { renderer, headerIds: false, mangle: false };
}
