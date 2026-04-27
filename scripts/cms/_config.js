// CMS Unified Configuration
function buildGiscusConfig() {
  const repo = process.env.GISCUS_REPO || '';
  const repoId = process.env.GISCUS_REPO_ID || '';
  const category = process.env.GISCUS_CATEGORY || '';
  const categoryId = process.env.GISCUS_CATEGORY_ID || '';

  return {
    enabled: Boolean(repo && repoId && category && categoryId),
    repo,
    repoId,
    category,
    categoryId,
    mapping: process.env.GISCUS_MAPPING || 'specific',
    strict: process.env.GISCUS_STRICT || '1',
    reactionsEnabled: process.env.GISCUS_REACTIONS_ENABLED || '1',
    emitMetadata: process.env.GISCUS_EMIT_METADATA || '0',
    inputPosition: process.env.GISCUS_INPUT_POSITION || 'top',
    lang: process.env.GISCUS_LANG || 'en',
    theme: process.env.GISCUS_THEME || 'preferred_color_scheme',
    loading: process.env.GISCUS_LOADING || 'lazy',
  };
}

function normalizeOrigin(value) {
  try {
    return value ? new URL(value).origin : '';
  } catch {
    return '';
  }
}

function buildAnalyticsConfig(overrides = {}) {
  const endpoint = overrides.endpoint ?? process.env.ANALYTICS_ENDPOINT ?? '';

  return {
    enabled: overrides.enabled ?? true,
    endpoint,
    endpointOrigin: overrides.endpointOrigin || normalizeOrigin(endpoint),
    respectDoNotTrack: overrides.respectDoNotTrack ?? true,
    storageKey: overrides.storageKey || 'dout:analytics:page-hits',
    optOutKey: overrides.optOutKey || 'dout:analytics:opt-out',
    dashboardPath: overrides.dashboardPath || '/privacy.html',
  };
}

function buildSecurityConfig({ analytics, overrides = {} } = {}) {
  const connectSrc = ["'self'", 'https://giscus.app'];

  if (analytics?.endpointOrigin) {
    connectSrc.push(analytics.endpointOrigin);
  }

  const metaCspDirectives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "media-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "script-src 'self' 'unsafe-inline' https://giscus.app",
    "style-src 'self' 'unsafe-inline'",
    `connect-src ${connectSrc.join(' ')}`,
    'frame-src https://giscus.app https://codepen.io',
  ];
  const headerCspDirectives = [
    ...metaCspDirectives,
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ];

  const defaults = {
    csp: metaCspDirectives.join('; '),
    headerCsp: headerCspDirectives.join('; '),
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy:
      'accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), browsing-topics=()',
  };

  return {
    ...defaults,
    ...overrides,
    csp: overrides.csp || defaults.csp,
    headerCsp: overrides.headerCsp || defaults.headerCsp,
    permissionsPolicy: overrides.permissionsPolicy || defaults.permissionsPolicy,
    referrerPolicy: overrides.referrerPolicy || defaults.referrerPolicy,
  };
}

function buildSiteMeta(overrides = {}) {
  const analytics = buildAnalyticsConfig(overrides.analytics);
  const security = buildSecurityConfig({ analytics, overrides: overrides.security });

  return {
    baseUrl: overrides.baseUrl || '/',
    url: overrides.url || 'https://dout.dev',
    rssFeedPath: overrides.rssFeedPath || '/feed.rss',
    jsonFeedPath: overrides.jsonFeedPath || '/feed.json',
    legacyRssFeedPath: overrides.legacyRssFeedPath || '/feed.xml',
    title: overrides.title || 'dout.dev',
    description:
      overrides.description || 'Vanilla-first static blog with WCAG 2.2 AA accessibility',
    author: overrides.author || 'Emiliano "pixu1980" Pisu',
    language: overrides.language || 'en',
    locale: overrides.locale || 'en-US',
    year: overrides.year || String(new Date().getFullYear()),
    giscus: { ...buildGiscusConfig(), ...(overrides.giscus || {}) },
    analytics,
    security,
  };
}

export const defaultConfig = {
  contentDir: 'data/posts',
  dataDir: 'data',
  postsOutputDir: 'src/posts',
  tagsOutputDir: 'src/tags',
  monthsOutputDir: 'src/months',
  seriesOutputDir: 'src/series',
  site: buildSiteMeta(),
  PAGE_SIZE: 10,
  SITE_META: buildSiteMeta(),
};

export function resolveConfig(overrides = {}) {
  const site = buildSiteMeta({ ...defaultConfig.site, ...(overrides.site || {}) });
  const siteMeta = buildSiteMeta({ ...defaultConfig.SITE_META, ...(overrides.SITE_META || {}) });

  return {
    ...defaultConfig,
    ...overrides,
    site,
    SITE_META: siteMeta,
  };
}
