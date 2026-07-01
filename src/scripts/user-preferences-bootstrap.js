const STORAGE_KEYS = Object.freeze({
  accentColor: 'accent-color',
  colorScheme: 'color-scheme',
  displayPreferences: 'display-preferences',
  postFeedLayout: 'post-feed-layout',
});

const ACCENT_OPTIONS = Object.freeze([
  { h: 16, id: 'coral', l: 58, s: 95 },
  { h: 340, id: 'rose', l: 62, s: 90 },
  { h: 280, id: 'lavender', l: 65, s: 85 },
  { h: 200, id: 'sky', l: 62, s: 85 },
  { h: 145, id: 'mint', l: 60, s: 80 },
]);

const BODY_FONT_OPTIONS = Object.freeze([
  {
    id: 'system-sans',
    stack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  {
    id: 'humanist-sans',
    stack: "'Avenir Next', 'Segoe UI Variable Text', 'Helvetica Neue', sans-serif",
  },
  { id: 'book-serif', stack: "Georgia, Cambria, 'Times New Roman', serif" },
  {
    id: 'editorial-serif',
    stack: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif",
  },
  { id: 'readable-serif', stack: "Charter, 'Bitstream Charter', 'Sitka Text', Georgia, serif" },
  {
    id: 'open-dyslexic',
    stack: "'OpenDyslexic', 'Atkinson Hyperlegible', system-ui, sans-serif",
  },
]);

const CODE_FONT_OPTIONS = Object.freeze([
  { id: 'system-mono', stack: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace" },
  {
    id: 'plex-mono',
    stack: "'IBM Plex Mono', 'SFMono-Regular', 'Cascadia Code', Consolas, monospace",
  },
  { id: 'cascadia-mono', stack: "'Cascadia Code', 'SFMono-Regular', Menlo, Consolas, monospace" },
  { id: 'classic-mono', stack: "'Courier New', Courier, monospace" },
]);

const HEADING_FONT_OPTIONS = Object.freeze([
  {
    id: 'system-sans',
    stack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  {
    id: 'humanist-sans',
    stack: "'Avenir Next', 'Segoe UI Variable Text', 'Helvetica Neue', sans-serif",
  },
  {
    id: 'editorial-serif',
    stack: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif",
  },
  { id: 'book-serif', stack: "Baskerville, 'Times New Roman', Georgia, serif" },
  { id: 'rounded-sans', stack: "Optima, Candara, 'Trebuchet MS', 'Gill Sans', sans-serif" },
  {
    id: 'open-dyslexic',
    stack: "'OpenDyslexic', 'Atkinson Hyperlegible', system-ui, sans-serif",
  },
]);

const COLOR_SCHEMES = Object.freeze(['light', 'dark', 'system']);
const FONT_SCALE_OPTIONS = Object.freeze(['75%', '80%', '90%', '100%', '110%', '120%', '125%']);
const LAYOUTS = Object.freeze(['list', 'grid']);
const RADIUS_PRESET_OPTIONS = Object.freeze(['square', 'rounded', 'squircle']);
const DEFAULT_PREFERENCES = Object.freeze({
  bodyFont: 'system-sans',
  codeFont: 'system-mono',
  colorScheme: 'system',
  fontScale: '100%',
  headingFont: 'system-sans',
  postFeedLayout: 'list',
  radiusPreset: 'rounded',
});

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStorageValue(storage, key) {
  try {
    return storage?.getItem(key) || null;
  } catch {
    return null;
  }
}

function parseJsonObject(value) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function findOption(options, optionId, fallbackId) {
  return (
    options.find((option) => option.id === optionId) ||
    options.find((option) => option.id === fallbackId) ||
    options[0]
  );
}

function getOrCreateColorSchemeMeta(targetDocument) {
  const existing = targetDocument.querySelector('meta[name="color-scheme"]');
  if (existing) {
    return existing;
  }

  const meta = targetDocument.createElement('meta');
  meta.setAttribute('name', 'color-scheme');
  targetDocument.head.appendChild(meta);
  return meta;
}

function normalizeColorScheme(value) {
  return COLOR_SCHEMES.includes(value) ? value : DEFAULT_PREFERENCES.colorScheme;
}

function normalizePostFeedLayout(value) {
  return LAYOUTS.includes(value) ? value : DEFAULT_PREFERENCES.postFeedLayout;
}

function normalizePreferences(preferences = {}) {
  const candidate = preferences && typeof preferences === 'object' ? preferences : {};

  return {
    bodyFont: findOption(BODY_FONT_OPTIONS, candidate.bodyFont, DEFAULT_PREFERENCES.bodyFont).id,
    codeFont: findOption(CODE_FONT_OPTIONS, candidate.codeFont, DEFAULT_PREFERENCES.codeFont).id,
    fontScale: FONT_SCALE_OPTIONS.includes(candidate.fontScale)
      ? candidate.fontScale
      : DEFAULT_PREFERENCES.fontScale,
    headingFont: findOption(
      HEADING_FONT_OPTIONS,
      candidate.headingFont,
      DEFAULT_PREFERENCES.headingFont
    ).id,
    increaseContrast: candidate.increaseContrast === true,
    radiusPreset: RADIUS_PRESET_OPTIONS.includes(candidate.radiusPreset)
      ? candidate.radiusPreset
      : DEFAULT_PREFERENCES.radiusPreset,
    reduceMotion: candidate.reduceMotion === true || candidate.reduceAnimations === true,
    reduceTransparency: candidate.reduceTransparency === true,
  };
}

function toggleRootAttribute(root, attributeName, isEnabled) {
  if (isEnabled) {
    root.setAttribute(attributeName, 'true');
    return;
  }

  root.removeAttribute(attributeName);
}

function applyColorScheme(colorScheme, targetDocument = document) {
  const normalized = normalizeColorScheme(colorScheme);
  const root = targetDocument.documentElement;
  const meta = getOrCreateColorSchemeMeta(targetDocument);

  if (normalized === 'system') {
    root.removeAttribute('data-color-scheme');
    root.style.colorScheme = 'light dark';
    meta.content = 'light dark';
    return normalized;
  }

  root.setAttribute('data-color-scheme', normalized);
  root.style.colorScheme = normalized;
  meta.content = normalized;
  return normalized;
}

function applyAccentColor(accentColor, targetDocument = document) {
  const accent = findOption(ACCENT_OPTIONS, accentColor, 'coral');
  const root = targetDocument.documentElement;

  root.style.setProperty('--dout--accent-h', accent.h);
  root.style.setProperty('--dout--accent-s', `${accent.s}%`);
  root.style.setProperty('--dout--accent-l', `${accent.l}%`);

  return accent.id;
}

function applyPostFeedLayout(postFeedLayout, targetDocument = document) {
  const normalized = normalizePostFeedLayout(postFeedLayout);
  targetDocument.documentElement.dataset.postFeedLayout = normalized;
  return normalized;
}

function applyDisplayPreferences(preferences, targetDocument = document) {
  const normalized = normalizePreferences(preferences);
  const root = targetDocument.documentElement;

  toggleRootAttribute(root, 'data-reduce-motion', normalized.reduceMotion);
  toggleRootAttribute(root, 'data-reduce-transparency', normalized.reduceTransparency);
  toggleRootAttribute(root, 'data-increase-contrast', normalized.increaseContrast);
  root.removeAttribute('data-reduce-animations');

  if (normalized.fontScale === DEFAULT_PREFERENCES.fontScale) {
    root.style.removeProperty('font-size');
  } else {
    root.style.fontSize = normalized.fontScale;
  }

  root.style.setProperty(
    '--dout--font-display',
    findOption(HEADING_FONT_OPTIONS, normalized.headingFont, DEFAULT_PREFERENCES.headingFont).stack
  );
  root.style.setProperty(
    '--dout--font-sans',
    findOption(BODY_FONT_OPTIONS, normalized.bodyFont, DEFAULT_PREFERENCES.bodyFont).stack
  );
  root.style.setProperty(
    '--dout--font-mono',
    findOption(CODE_FONT_OPTIONS, normalized.codeFont, DEFAULT_PREFERENCES.codeFont).stack
  );
  root.dataset.radiusPreset = normalized.radiusPreset;

  return normalized;
}

function applyUserPreferences(options = {}) {
  const targetDocument = options.document || document;
  const storage = options.storage === undefined ? getStorage() : options.storage;
  const displayPreferences = parseJsonObject(
    readStorageValue(storage, STORAGE_KEYS.displayPreferences)
  );

  return {
    accentColor: applyAccentColor(
      readStorageValue(storage, STORAGE_KEYS.accentColor),
      targetDocument
    ),
    colorScheme: applyColorScheme(
      readStorageValue(storage, STORAGE_KEYS.colorScheme),
      targetDocument
    ),
    displayPreferences: applyDisplayPreferences(displayPreferences, targetDocument),
    postFeedLayout: applyPostFeedLayout(
      readStorageValue(storage, STORAGE_KEYS.postFeedLayout),
      targetDocument
    ),
  };
}

function markUserPreferencesReady(targetDocument = document) {
  targetDocument.documentElement.dataset.userPreferences = 'ready';
}

function bootUserPreferences(options = {}) {
  const targetDocument = options.document || document;

  const result = applyUserPreferences({ ...options, document: targetDocument });
  markUserPreferencesReady(targetDocument);
  return result;
}

if (typeof document !== 'undefined') {
  bootUserPreferences();
}

export {
  applyAccentColor,
  applyColorScheme,
  applyDisplayPreferences,
  applyPostFeedLayout,
  applyUserPreferences,
  bootUserPreferences,
  DEFAULT_PREFERENCES,
  markUserPreferencesReady,
  normalizePreferences,
  STORAGE_KEYS,
};
