const INTERNAL_HOSTS = new Set(['dout.dev', 'www.dout.dev']);
const OUTBOUND_SOURCE_PARAM = 'from';
const OUTBOUND_SOURCE_VALUE = 'dout.dev';
const OUTBOUND_REFERRER_POLICY = 'strict-origin-when-cross-origin';

function isHttpUrl(url) {
  return url.protocol === 'http:' || url.protocol === 'https:';
}

function isInternalUrl(url) {
  return url.origin === window.location.origin || INTERNAL_HOSTS.has(url.hostname);
}

function decorateExternalLink(anchor) {
  if (!(anchor instanceof HTMLAnchorElement)) {
    return false;
  }

  const href = anchor.getAttribute('href');
  if (!href) {
    return false;
  }

  let url;

  try {
    url = new URL(href, window.location.origin);
  } catch {
    return false;
  }

  if (!isHttpUrl(url) || isInternalUrl(url)) {
    return false;
  }

  url.searchParams.set(OUTBOUND_SOURCE_PARAM, OUTBOUND_SOURCE_VALUE);

  const rel = new Set((anchor.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
  rel.delete('noreferrer');
  rel.add('noopener');

  anchor.href = url.toString();
  anchor.target = '_blank';
  anchor.setAttribute('referrerpolicy', OUTBOUND_REFERRER_POLICY);
  anchor.setAttribute('rel', [...rel].join(' '));

  return true;
}

function initExternalLinks(root = document) {
  if (typeof document === 'undefined') {
    return;
  }

  const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
  scope.querySelectorAll('a[href]').forEach((anchor) => {
    decorateExternalLink(anchor);
  });
}

export { decorateExternalLink, initExternalLinks };
