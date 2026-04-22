/**
 * Internal OpenGraph/Twitter metadata checker for dout.dev.
 *
 * Sources and design references:
 * - Simon Hartcher, "Testing OpenGraph on localhost from the CLI before you go public"
 *   https://simonhartcher.com/posts/2026-04-15-testing-opengraph-on-localhost-from-the-cli/
 * - deevus/neutils `og-check`
 *   https://github.com/deevus/neutils/tree/main/src/tools/og-check
 *
 * This is a small Node.js reimplementation tailored to dout.dev's local preview,
 * CI, and deployment validation workflow. It intentionally stays runtime-vanilla:
 * only Node built-ins are used here.
 */

const DEFAULT_TIMEOUT_MS = 5000;
const TOOL_NAME = 'dout-og-check';
const VERSION = 1;

const HTML_NAME_ALLOW_LIST = new Set([
  'application-name',
  'author',
  'description',
  'keywords',
  'robots',
  'theme-color',
]);

const NAMED_ENTITIES = new Map([
  ['amp', '&'],
  ['apos', "'"],
  ['gt', '>'],
  ['lt', '<'],
  ['nbsp', ' '],
  ['quot', '"'],
]);

const ATTRIBUTE_REQUIREMENTS = {
  article: 'property',
  book: 'property',
  fb: 'property',
  html: 'name',
  music: 'property',
  og: 'property',
  profile: 'property',
  twitter: 'name',
  video: 'property',
};

const ATTRIBUTE_MISMATCH_SEVERITY = {
  article: 'error',
  book: 'error',
  fb: 'error',
  html: 'warning',
  music: 'error',
  og: 'error',
  profile: 'error',
  twitter: 'warning',
  video: 'error',
};

const SCHEMA_LABELS = {
  opengraph: 'OpenGraph',
  twitter: 'Twitter Card',
};

const URL_FIELDS_BY_SCHEMA = {
  opengraph: [
    'og:url',
    'og:image',
    'og:image:url',
    'og:image:secure_url',
    'og:audio',
    'og:audio:url',
    'og:audio:secure_url',
    'og:video',
    'og:video:url',
    'og:video:secure_url',
  ],
  twitter: ['twitter:url', 'twitter:image', 'twitter:image:src', 'twitter:player'],
};

const OUTPUT_SCHEMAS = {
  json: ['opengraph', 'twitter'],
  none: ['opengraph', 'twitter'],
  opengraph: ['opengraph'],
  table: ['opengraph', 'twitter'],
  twitter: ['twitter'],
};

function isCiEnvironment() {
  return process.env.GITHUB_ACTIONS === 'true' || process.env.FORGEJO_ACTIONS === 'true';
}

function normalizeLineWhitespace(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtmlEntities(value) {
  return String(value ?? '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (!entity) return match;

    if (entity[0] === '#') {
      const isHex = entity[1]?.toLowerCase() === 'x';
      const raw = isHex ? entity.slice(2) : entity.slice(1);
      const codePoint = Number.parseInt(raw, isHex ? 16 : 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    return NAMED_ENTITIES.get(entity.toLowerCase()) || match;
  });
}

function escapeCiText(value) {
  return String(value ?? '')
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A');
}

function schemaLabel(schema) {
  return SCHEMA_LABELS[schema] || schema;
}

export function defaultOutputFormat() {
  return isCiEnvironment() ? 'none' : 'opengraph';
}

export function defaultIssueFormat() {
  return isCiEnvironment() ? 'ci' : 'human';
}

function schemasForOutputFormat(outputFormat) {
  return OUTPUT_SCHEMAS[outputFormat] || OUTPUT_SCHEMAS.none;
}

function expectedMetaAttribute(namespace) {
  return ATTRIBUTE_REQUIREMENTS[namespace] || 'name';
}

function attributeMismatchSeverity(namespace) {
  return ATTRIBUTE_MISMATCH_SEVERITY[namespace] || 'warning';
}

function namespaceFromKey(key) {
  const normalized = String(key ?? '').toLowerCase();
  const prefix = normalized.split(':', 1)[0];

  switch (prefix) {
    case 'article':
    case 'book':
    case 'fb':
    case 'music':
    case 'og':
    case 'profile':
    case 'twitter':
    case 'video':
      return prefix;
    default:
      return 'html';
  }
}

function parseAttributes(tagSource) {
  const attributes = {};
  const attributePattern = /([^\s"'=<>`/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  const trimmedTag = tagSource.replace(/^<meta\b/i, '').replace(/\/?\s*>$/, '');
  let match = attributePattern.exec(trimmedTag);

  while (match) {
    const [, rawName, doubleQuoted, singleQuoted, unquoted] = match;
    const name = rawName.toLowerCase();
    const value = doubleQuoted ?? singleQuoted ?? unquoted ?? '';
    attributes[name] = value;
    match = attributePattern.exec(trimmedTag);
  }

  return attributes;
}

function createLookup(metaTags) {
  const lookup = new Map();

  for (const tag of metaTags) {
    if (!lookup.has(tag.key)) {
      lookup.set(tag.key, tag);
    }
  }

  return lookup;
}

export function scanHtml(html) {
  const source = String(html ?? '');
  const metaTags = [];
  const titleMatch = source.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(normalizeLineWhitespace(titleMatch[1])) : '';

  const metaPattern = /<meta\b[^>]*>/gi;
  let match = metaPattern.exec(source);

  while (match) {
    const raw = match[0];
    const attributes = parseAttributes(raw);
    const metaKey = attributes.property ? 'property' : attributes.name ? 'name' : null;
    const key = attributes.property || attributes.name;

    if (!metaKey || !key || !Object.hasOwn(attributes, 'content')) {
      match = metaPattern.exec(source);
      continue;
    }

    const normalizedKey = key.toLowerCase();
    const namespace = namespaceFromKey(normalizedKey);

    if (namespace === 'html' && !HTML_NAME_ALLOW_LIST.has(normalizedKey)) {
      match = metaPattern.exec(source);
      continue;
    }

    metaTags.push({
      key: normalizedKey,
      metaKey,
      namespace,
      raw,
      value: decodeHtmlEntities(attributes.content),
    });

    match = metaPattern.exec(source);
  }

  return {
    lookup: createLookup(metaTags),
    metaTags,
    title,
  };
}

export function findMeta(scanResult, key) {
  return scanResult.lookup.get(String(key).toLowerCase()) || null;
}

function findFirstMeta(scanResult, keys) {
  for (const key of keys) {
    const meta = findMeta(scanResult, key);
    if (meta) return meta;
  }

  return null;
}

function buildIssue(severity, schema, rule, field, reason) {
  const label =
    rule === 'invalid_attribute'
      ? 'invalid attribute'
      : rule === 'invalid_url'
        ? 'invalid URL'
        : 'missing required field';

  return {
    field,
    message: reason ? `${label} \`${field}\`: ${reason}` : `${label} \`${field}\``,
    reason: reason || null,
    rule,
    schema,
    severity,
  };
}

function groupedMeta(scanResult) {
  const grouped = {};

  if (scanResult.title) {
    grouped.html = { title: scanResult.title };
  }

  for (const tag of scanResult.metaTags) {
    const namespace = tag.namespace;
    const prefix = namespace === 'html' ? '' : `${namespace}:`;
    const shortKey = prefix && tag.key.startsWith(prefix) ? tag.key.slice(prefix.length) : tag.key;

    grouped[namespace] ||= {};
    grouped[namespace][shortKey] = tag.value;
  }

  return grouped;
}

function rewriteUrl(value, rewriteOrigins = []) {
  if (!rewriteOrigins.length) {
    return value;
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return value;
  }

  for (const rewrite of rewriteOrigins) {
    const fromOrigin = new URL(rewrite.from).origin;
    const toOrigin = new URL(rewrite.to).origin;

    if (parsed.origin === fromOrigin) {
      return new URL(parsed.pathname + parsed.search + parsed.hash, toOrigin).toString();
    }
  }

  return value;
}

async function fetchWithTimeout(url, init = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchDocument(url, options = {}) {
  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': `${TOOL_NAME}/${VERSION} (+https://dout.dev)`,
      },
      redirect: 'follow',
    },
    options.timeoutMs || DEFAULT_TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(`GET ${url} returned ${response.status}`);
  }

  return {
    body: await response.text(),
    finalUrl: response.url,
    status: response.status,
  };
}

async function fetchUrlStatus(url, options = {}) {
  const cache = options.urlStatusCache;
  if (cache?.has(url)) {
    return cache.get(url);
  }

  let statusInfo;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          'user-agent': `${TOOL_NAME}/${VERSION} (+https://dout.dev)`,
        },
        method: 'HEAD',
        redirect: 'follow',
      },
      options.timeoutMs || DEFAULT_TIMEOUT_MS
    );

    if (response.status === 405 || response.status === 501) {
      const fallback = await fetchWithTimeout(
        url,
        {
          headers: {
            'user-agent': `${TOOL_NAME}/${VERSION} (+https://dout.dev)`,
          },
          method: 'GET',
          redirect: 'follow',
        },
        options.timeoutMs || DEFAULT_TIMEOUT_MS
      );

      statusInfo = {
        ok: fallback.ok,
        status: fallback.status,
        statusText: fallback.statusText,
      };
    } else {
      statusInfo = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      };
    }
  } catch (error) {
    statusInfo = {
      ok: false,
      status: 0,
      statusText: error?.name === 'AbortError' ? 'timeout' : error?.message || 'fetch failed',
    };
  }

  cache?.set(url, statusInfo);
  return statusInfo;
}

async function validateUrlsForSchema(scanResult, schema, options, appendIssue) {
  const fields = URL_FIELDS_BY_SCHEMA[schema] || [];

  for (const field of fields) {
    const meta = findMeta(scanResult, field);
    if (!meta) continue;

    let parsed;
    try {
      parsed = new URL(meta.value);
    } catch {
      appendIssue('error', schema, 'invalid_url', field, 'not a valid absolute URL');
      continue;
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      appendIssue('error', schema, 'invalid_url', field, 'must use http or https');
      continue;
    }

    if (options.checkUrlStatus === false) {
      continue;
    }

    const targetUrl = rewriteUrl(meta.value, options.rewriteOrigins || []);
    const status = await fetchUrlStatus(targetUrl, options);

    if (!status.ok) {
      appendIssue(
        'error',
        schema,
        'invalid_url',
        field,
        status.status ? `URL returned status ${status.status}` : status.statusText
      );
    }
  }
}

export async function validateScanResult(scanResult, options = {}) {
  const outputFormat = options.outputFormat || defaultOutputFormat();
  const schemas = options.schemas || schemasForOutputFormat(outputFormat);
  const errors = [];
  const warnings = [];

  const appendIssue = (severity, schema, rule, field, reason) => {
    const issue = buildIssue(severity, schema, rule, field, reason);
    if (severity === 'error') {
      errors.push(issue);
    } else {
      warnings.push(issue);
    }
  };

  for (const meta of scanResult.metaTags) {
    const expected = expectedMetaAttribute(meta.namespace);
    if (meta.metaKey !== expected) {
      appendIssue(
        attributeMismatchSeverity(meta.namespace),
        meta.namespace === 'twitter' ? 'twitter' : 'opengraph',
        'invalid_attribute',
        meta.key,
        `expected ${expected}, got ${meta.metaKey}`
      );
    }
  }

  for (const schema of schemas) {
    if (schema === 'opengraph') {
      if (!findMeta(scanResult, 'og:title')) {
        appendIssue('error', schema, 'missing_required', 'og:title');
      }
      if (!findFirstMeta(scanResult, ['og:image', 'og:image:url'])) {
        appendIssue('error', schema, 'missing_required', 'og:image');
      }
      if (!findMeta(scanResult, 'og:type')) {
        appendIssue('error', schema, 'missing_required', 'og:type');
      }
      if (!findMeta(scanResult, 'og:url')) {
        appendIssue('error', schema, 'missing_required', 'og:url');
      }
    }

    if (schema === 'twitter') {
      if (!findMeta(scanResult, 'twitter:card')) {
        appendIssue('error', schema, 'missing_required', 'twitter:card');
      }
      if (!findFirstMeta(scanResult, ['twitter:title', 'og:title'])) {
        appendIssue('error', schema, 'missing_required', 'twitter:title');
      }
      if (!findFirstMeta(scanResult, ['twitter:image', 'twitter:image:src', 'og:image'])) {
        appendIssue('error', schema, 'missing_required', 'twitter:image');
      }
    }

    await validateUrlsForSchema(scanResult, schema, options, appendIssue);
  }

  return {
    errors,
    issues: [...errors, ...warnings],
    status: errors.length > 0 ? 'errors' : warnings.length > 0 ? 'warnings_only' : 'success',
    warnings,
  };
}

function renderOpenGraphPreview(scanResult, url) {
  const title = findFirstMeta(scanResult, ['og:title'])?.value || scanResult.title || '(missing)';
  const description = findFirstMeta(scanResult, ['og:description'])?.value || '(missing)';
  const image = findFirstMeta(scanResult, ['og:image', 'og:image:url'])?.value || '(missing)';
  const imageAlt = findFirstMeta(scanResult, ['og:image:alt'])?.value || '(missing)';
  const type = findFirstMeta(scanResult, ['og:type'])?.value || '(missing)';
  const canonical = findFirstMeta(scanResult, ['og:url'])?.value || url;
  const locale = findFirstMeta(scanResult, ['og:locale'])?.value || '(missing)';

  return [
    `OpenGraph preview for ${url}`,
    '',
    `Title: ${title}`,
    `Description: ${description}`,
    `Image: ${image}`,
    `Image Alt: ${imageAlt}`,
    `Type: ${type}`,
    `URL: ${canonical}`,
    `Locale: ${locale}`,
  ].join('\n');
}

function renderTwitterPreview(scanResult, url) {
  const title =
    findFirstMeta(scanResult, ['twitter:title', 'og:title'])?.value ||
    scanResult.title ||
    '(missing)';
  const description =
    findFirstMeta(scanResult, ['twitter:description', 'og:description'])?.value || '(missing)';
  const image =
    findFirstMeta(scanResult, ['twitter:image', 'twitter:image:src', 'og:image'])?.value ||
    '(missing)';
  const imageAlt =
    findFirstMeta(scanResult, ['twitter:image:alt', 'og:image:alt'])?.value || '(missing)';
  const card = findFirstMeta(scanResult, ['twitter:card'])?.value || '(missing)';
  const canonical = findFirstMeta(scanResult, ['twitter:url', 'og:url'])?.value || url;

  return [
    `Twitter Card preview for ${url}`,
    '',
    `Title: ${title}`,
    `Description: ${description}`,
    `Image: ${image}`,
    `Image Alt: ${imageAlt}`,
    `Card: ${card}`,
    `URL: ${canonical}`,
  ].join('\n');
}

function renderTablePreview(scanResult, url) {
  const grouped = groupedMeta(scanResult);
  const lines = [`Meta table for ${url}`, ''];

  for (const [namespace, entries] of Object.entries(grouped)) {
    lines.push(`## ${namespace}`);
    lines.push('| Field | Value |');
    lines.push('| --- | --- |');

    for (const [field, value] of Object.entries(entries)) {
      lines.push(`| ${field} | ${String(value).replace(/\|/g, '\\|')} |`);
    }

    lines.push('');
  }

  return lines.join('\n').trim();
}

export function renderPreview(scanResult, options = {}) {
  const outputFormat = options.outputFormat || defaultOutputFormat();
  const url = options.url || '';

  switch (outputFormat) {
    case 'opengraph':
      return renderOpenGraphPreview(scanResult, url);
    case 'twitter':
      return renderTwitterPreview(scanResult, url);
    case 'table':
      return renderTablePreview(scanResult, url);
    case 'json':
      return `${JSON.stringify(groupedMeta(scanResult), null, 2)}\n`;
    case 'none':
    default:
      return '';
  }
}

export function renderIssues(validationResult, options = {}) {
  const issueFormat = options.issueFormat || defaultIssueFormat();
  const urlLabel = options.url || '';

  if (issueFormat === 'json') {
    return `${JSON.stringify(
      {
        issues: validationResult.issues,
        schema_version: 1,
        status: validationResult.status === 'errors' ? 'fail' : 'pass',
        summary: {
          errors: validationResult.errors.length,
          warnings: validationResult.warnings.length,
        },
        tool: TOOL_NAME,
        url: urlLabel,
        version: VERSION,
      },
      null,
      2
    )}\n`;
  }

  if (issueFormat === 'ci') {
    return validationResult.issues
      .map((issue) => {
        const command = issue.severity === 'error' ? 'error' : 'warning';
        const title = escapeCiText(schemaLabel(issue.schema));
        const message = escapeCiText(`${urlLabel} — ${issue.message}`);
        return `::${command} title=${title}::${message}`;
      })
      .join('\n');
  }

  if (!validationResult.issues.length) {
    return `✅ ${urlLabel}\n`;
  }

  const lines = [`Checking ${urlLabel}`, ''];
  let currentSchema = null;

  for (const issue of validationResult.issues) {
    if (issue.schema !== currentSchema) {
      currentSchema = issue.schema;
      lines.push(schemaLabel(issue.schema));
    }

    lines.push(`- ${issue.severity === 'error' ? '❌' : '⚠️'} ${issue.message}`);
  }

  lines.push('');
  lines.push(
    `errors: ${validationResult.errors.length}, warnings: ${validationResult.warnings.length}`
  );
  return lines.join('\n');
}

export async function inspectUrl(url, options = {}) {
  const outputFormat = options.outputFormat || defaultOutputFormat();
  const issueFormat = options.issueFormat || defaultIssueFormat();
  const document = await fetchDocument(url, options);
  const scanResult = scanHtml(document.body);
  const validation = await validateScanResult(scanResult, {
    ...options,
    outputFormat,
  });

  return {
    document,
    issueFormat,
    outputFormat,
    preview: renderPreview(scanResult, {
      outputFormat,
      url,
    }),
    scanResult,
    validation,
  };
}
