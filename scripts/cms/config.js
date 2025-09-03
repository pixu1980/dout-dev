// CMS Unified Configuration
export const defaultConfig = {
  contentDir: 'data/posts',
  dataDir: 'data',
  postsOutputDir: 'src/posts',
  tagsOutputDir: 'src/tags',
  monthsOutputDir: 'src/months',
  seriesOutputDir: 'src/series',
  site: {
    baseUrl: '/',
    url: 'https://dout.dev',
    title: 'dout.dev',
    description: 'Vanilla-first static blog with WCAG 2.2 AAA accessibility',
    author: 'Emiliano "pixu1980" Pisu',
    language: 'en',
    locale: 'en-US',
  },
  PAGE_SIZE: 10,
  SITE_META: {
    title: 'dout.dev',
    description: 'Vanilla-first static blog with WCAG 2.2 AAA accessibility',
    author: 'Emiliano "pixu1980" Pisu',
    url: 'https://dout.dev',
    baseUrl: '/',
    language: 'en',
    locale: 'en-US',
  },
};

export function resolveConfig(overrides = {}) {
  return {
    ...defaultConfig,
    ...overrides,
    site: { ...defaultConfig.site, ...(overrides.site || {}) },
    SITE_META: { ...defaultConfig.SITE_META, ...(overrides.SITE_META || {}) },
  };
}
