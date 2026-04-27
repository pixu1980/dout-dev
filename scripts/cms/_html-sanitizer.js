import { JSDOM } from 'jsdom';

const URL_ATTRIBUTES = new Set([
  'action',
  'cite',
  'data',
  'formaction',
  'href',
  'poster',
  'src',
  'xlink:href',
]);

const REMOVED_ELEMENTS = new Set(['base', 'embed', 'meta', 'object', 'script']);
const ALLOWED_IFRAME_HOSTS = new Set(['codepen.io']);
const INTERNAL_HOSTS = new Set(['dout.dev', 'www.dout.dev']);
const OUTBOUND_SOURCE_PARAM = 'from';
const OUTBOUND_SOURCE_VALUE = 'dout.dev';
const OUTBOUND_REFERRER_POLICY = 'strict-origin-when-cross-origin';

function isSafeUrl(value, attributeName, tagName) {
  const normalized = String(value || '').trim();
  if (!normalized) return true;

  const lower = normalized.toLowerCase();
  if (
    lower.startsWith('#') ||
    lower.startsWith('/') ||
    lower.startsWith('./') ||
    lower.startsWith('../')
  ) {
    return true;
  }

  if (lower.startsWith('mailto:') || lower.startsWith('tel:')) {
    return true;
  }

  if (attributeName === 'src' && tagName === 'img' && lower.startsWith('data:image/')) {
    return true;
  }

  try {
    const url = new URL(normalized, 'https://dout.dev');
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function sanitizeSrcset(value) {
  return String(value || '')
    .split(',')
    .map((candidate) => candidate.trim())
    .filter(Boolean)
    .filter((candidate) => {
      const [url] = candidate.split(/\s+/, 1);
      return isSafeUrl(url, 'src', 'img');
    })
    .join(', ');
}

function sanitizeStyleValue(value) {
  const normalized = String(value || '');
  if (!normalized) return '';

  if (/expression\s*\(|javascript:|@import|behavior\s*:/i.test(normalized)) {
    return '';
  }

  return normalized;
}

function sanitizeStyleElement(element) {
  const safeCss = sanitizeStyleValue(element.textContent || '');
  if (!safeCss) {
    element.remove();
    return;
  }

  element.textContent = safeCss;
}

function sanitizeIframe(element) {
  const src = element.getAttribute('src') || '';

  try {
    const url = new URL(src, 'https://dout.dev');
    if (!ALLOWED_IFRAME_HOSTS.has(url.hostname)) {
      element.remove();
      return;
    }
  } catch {
    element.remove();
    return;
  }

  element.classList.add('embed-frame', 'embed-frame--codepen');
  element.setAttribute('loading', element.getAttribute('loading') || 'lazy');
  element.setAttribute('referrerpolicy', 'no-referrer');
  element.setAttribute('sandbox', 'allow-popups allow-same-origin allow-scripts');

  if (!element.getAttribute('title')) {
    element.setAttribute('title', 'Embedded content');
  }
}

function isInternalSiteUrl(url) {
  return INTERNAL_HOSTS.has(url.hostname);
}

function decorateExternalAnchor(element, url) {
  url.searchParams.set(OUTBOUND_SOURCE_PARAM, OUTBOUND_SOURCE_VALUE);

  const rel = new Set((element.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
  rel.delete('noreferrer');
  rel.add('noopener');

  element.setAttribute('href', url.toString());
  element.setAttribute('target', '_blank');
  element.setAttribute('referrerpolicy', OUTBOUND_REFERRER_POLICY);
  element.setAttribute('rel', [...rel].join(' '));
}

function sanitizeAttributes(element) {
  for (const attribute of [...element.attributes]) {
    const name = attribute.name.toLowerCase();
    const value = attribute.value;

    if (name.startsWith('on') || name === 'srcdoc') {
      element.removeAttribute(attribute.name);
      continue;
    }

    if (name === 'style') {
      const safeStyle = sanitizeStyleValue(value);
      if (!safeStyle) {
        element.removeAttribute(attribute.name);
      } else {
        element.setAttribute(attribute.name, safeStyle);
      }
      continue;
    }

    if (name === 'srcset') {
      const safeSrcset = sanitizeSrcset(value);
      if (!safeSrcset) {
        element.removeAttribute(attribute.name);
      } else {
        element.setAttribute(attribute.name, safeSrcset);
      }
      continue;
    }

    if (URL_ATTRIBUTES.has(name) && !isSafeUrl(value, name, element.tagName.toLowerCase())) {
      element.removeAttribute(attribute.name);
    }
  }

  if (element.tagName.toLowerCase() === 'a') {
    const href = element.getAttribute('href');
    if (!href) return;

    try {
      const url = new URL(href, 'https://dout.dev');
      if (!/^https?:$/i.test(url.protocol) || isInternalSiteUrl(url)) {
        return;
      }

      decorateExternalAnchor(element, url);
    } catch {}
  }
}

export function sanitizeArticleHtml(html) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const { document } = dom.window;

  document.body.querySelectorAll('*').forEach((element) => {
    const tagName = element.tagName.toLowerCase();

    if (REMOVED_ELEMENTS.has(tagName)) {
      element.remove();
      return;
    }

    if (tagName === 'style') {
      sanitizeStyleElement(element);
      return;
    }

    if (tagName === 'iframe') {
      sanitizeIframe(element);
    }

    sanitizeAttributes(element);
  });

  return document.body.innerHTML;
}
