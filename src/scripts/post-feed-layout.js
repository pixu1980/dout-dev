const STORAGE_KEY = 'post-feed-layout';
const DEFAULT_LAYOUT = 'list';
const LAYOUTS = ['list', 'grid'];
const POST_FEED_SELECTOR = '[data-post-feed]';

let hasInitialized = false;
let scheduledFrame = 0;

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizePostFeedLayout(layout) {
  return LAYOUTS.includes(layout) ? layout : DEFAULT_LAYOUT;
}

function scheduleFrame(callback) {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    if (scheduledFrame) {
      window.cancelAnimationFrame(scheduledFrame);
    }

    scheduledFrame = window.requestAnimationFrame(() => {
      scheduledFrame = 0;
      callback();
    });
    return;
  }

  globalThis.setTimeout(callback, 0);
}

function resetFeedLayout(feed) {
  feed.querySelectorAll('[data-post-feed-item], .post-feed__item').forEach((item) => {
    item.style.removeProperty('grid-row-end');
  });
}

function refreshSingleFeed(feed) {
  if (!(feed instanceof HTMLElement)) {
    return;
  }

  resetFeedLayout(feed);
}

function refreshPostFeedLayouts() {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  scheduleFrame(() => {
    document.querySelectorAll(POST_FEED_SELECTOR).forEach((feed) => {
      refreshSingleFeed(feed);
    });
  });
}

function dispatchLayoutChange(layout) {
  if (typeof document === 'undefined') {
    return;
  }

  document.dispatchEvent(
    new CustomEvent('post-feed-layout-changed', {
      detail: { layout },
    })
  );
}

function getSavedPostFeedLayout() {
  const saved = getStorage()?.getItem(STORAGE_KEY);
  return normalizePostFeedLayout(saved);
}

function getCurrentPostFeedLayout() {
  if (typeof document === 'undefined') {
    return DEFAULT_LAYOUT;
  }

  return normalizePostFeedLayout(document.documentElement.dataset.postFeedLayout);
}

function applyPostFeedLayout(layout, options = {}) {
  const { emit = true, persist = true } = options;
  const normalized = normalizePostFeedLayout(layout);

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.postFeedLayout = normalized;
  }

  if (persist) {
    getStorage()?.setItem(STORAGE_KEY, normalized);
  }

  refreshPostFeedLayouts();

  if (emit) {
    dispatchLayoutChange(normalized);
  }

  return normalized;
}

function initPostFeedLayout() {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return DEFAULT_LAYOUT;
  }

  if (!hasInitialized) {
    hasInitialized = true;
    window.addEventListener('resize', refreshPostFeedLayouts);
    window.addEventListener('load', refreshPostFeedLayouts);
  }

  const layout = applyPostFeedLayout(getSavedPostFeedLayout(), {
    emit: false,
    persist: false,
  });

  refreshPostFeedLayouts();

  return layout;
}

if (typeof document !== 'undefined') {
  applyPostFeedLayout(getSavedPostFeedLayout(), { emit: false, persist: false });
}

export {
  DEFAULT_LAYOUT,
  LAYOUTS,
  STORAGE_KEY,
  applyPostFeedLayout,
  getCurrentPostFeedLayout,
  getSavedPostFeedLayout,
  initPostFeedLayout,
  normalizePostFeedLayout,
  refreshPostFeedLayouts,
};
