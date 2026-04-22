/**
 * Main JavaScript for dout.dev
 * Core functionality and progressive enhancement
 */

import { initLazyImages } from './lazy-images.js';
import { initArticleNavigation } from './article-navigation.js';
import { initExternalLinks } from './external-links.js';
import { initPostFeedLayout } from './post-feed-layout.js';
import { initPostFeedLoadMore } from './post-feed-load-more.js';
import { initAnalyticsDashboard, trackPageView } from './analytics.js';
import './components/ColorSchemeSelector/ColorSchemeSelector.js';
import './components/AccentColorSelector/AccentColorSelector.js';
import './components/DisplayPreferencesPopover/DisplayPreferencesPopover.js';
import './components/PostFeedLayoutSelector/PostFeedLayoutSelector.js';
import { enhancePixHighlighters } from './components/PixHighlighter/PixHighlighter.js';

const MANAGED_HEAD_SELECTOR = [
  'meta[name="description"]',
  'link[rel="canonical"]',
  'meta[property^="og:"]',
  'meta[name^="twitter:"]',
  'meta[name="referrer"]',
  'meta[http-equiv="Content-Security-Policy"]',
  'meta[name^="dout:analytics"]',
  'link[rel="alternate"][type="application/rss+xml"]',
  'link[rel="alternate"][type="application/feed+json"]',
  'script[type="application/ld+json"]',
].join(', ');

let hasBooted = false;
let searchModulePromise = null;
let navigationEventsInitialized = false;
let skipLinksInitialized = false;
let legacyThemeBridgeInitialized = false;
let accentBridgeInitialized = false;
let performanceMonitoringInitialized = false;
let serviceWorkerInitialized = false;
let enhancedNavigationInitialized = false;
let giscusThemeObserver = null;
let giscusThemeObserverTimeout = 0;
let searchWarmupHandle = 0;

function withInstantScrollBehavior(callback) {
  const root = document.documentElement;
  const previousInlineBehavior = root.style.scrollBehavior;

  root.style.scrollBehavior = 'auto';

  try {
    callback();
  } finally {
    window.requestAnimationFrame(() => {
      if (previousInlineBehavior) {
        root.style.scrollBehavior = previousInlineBehavior;
      } else {
        root.style.removeProperty('scroll-behavior');
      }
    });
  }
}

function scheduleIdle(callback, timeout = 1500) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout });
  }

  return window.setTimeout(() => callback({ didTimeout: true, timeRemaining: () => 0 }), 250);
}

function cancelIdle(handle) {
  if (!handle) return;

  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle);
    return;
  }

  window.clearTimeout(handle);
}

function syncGiscusTheme(theme) {
  const frame = document.querySelector('iframe.giscus-frame');
  if (!frame?.contentWindow) return;

  const giscusTheme = theme === 'dark' ? 'dark' : 'light';
  frame.contentWindow.postMessage(
    { giscus: { setConfig: { theme: giscusTheme } } },
    'https://giscus.app'
  );
}

function disconnectGiscusThemeBridge() {
  giscusThemeObserver?.disconnect();
  giscusThemeObserver = null;
  if (giscusThemeObserverTimeout) {
    window.clearTimeout(giscusThemeObserverTimeout);
    giscusThemeObserverTimeout = 0;
  }
}

function initGiscusThemeBridge() {
  disconnectGiscusThemeBridge();

  if (!document.querySelector('.comments-shell')) {
    return;
  }

  const syncTheme = () => {
    const colorScheme = document.documentElement.dataset.colorScheme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const theme =
      colorScheme === 'dark'
        ? 'dark'
        : colorScheme === 'light'
          ? 'light'
          : prefersDark.matches
            ? 'dark'
            : 'light';
    syncGiscusTheme(theme);
  };

  giscusThemeObserver = new MutationObserver(syncTheme);
  giscusThemeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-color-scheme'],
  });

  syncTheme();
  giscusThemeObserverTimeout = window.setTimeout(() => {
    disconnectGiscusThemeBridge();
  }, 10000);
}

function initLegacyThemeBridge() {
  if (legacyThemeBridgeInitialized) return;
  legacyThemeBridgeInitialized = true;

  const syncLegacyTheme = () => {
    const colorScheme = document.documentElement.dataset.colorScheme;
    if (colorScheme === 'light' || colorScheme === 'dark') {
      document.documentElement.dataset.theme = colorScheme;
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const observer = new MutationObserver(syncLegacyTheme);

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-color-scheme'],
  });

  syncLegacyTheme();
}

function initAccentBridge() {
  if (accentBridgeInitialized) return;

  const selector = document.querySelector('accent-color-selector');
  if (!selector) return;

  accentBridgeInitialized = true;
  selector.addEventListener('accent-changed', () => {});
}

function normalizePathname(pathname) {
  const normalized = String(pathname || '/');
  if (normalized === '/index.html') return '/';

  const withoutHtml = normalized.replace(/\.html$/, '');
  if (withoutHtml.length > 1 && withoutHtml.endsWith('/')) {
    return withoutHtml.slice(0, -1);
  }

  return withoutHtml || '/';
}

function closeNavigationMenu() {
  const nav = document.querySelector('.main-nav');
  const toggle = document.querySelector('.menu-toggle');
  if (!nav || !toggle) return;

  nav.dataset.open = 'false';
  toggle.setAttribute('aria-expanded', 'false');
}

function syncActiveNavigationLink() {
  const nav = document.querySelector('.main-nav');
  if (!nav) return;

  const currentPath = normalizePathname(window.location.pathname);
  nav.querySelectorAll('a').forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (!href) return;

    const targetPath = normalizePathname(new URL(href, window.location.origin).pathname);
    if (targetPath === currentPath) {
      anchor.setAttribute('aria-current', 'page');
    } else {
      anchor.removeAttribute('aria-current');
    }
  });
}

function initNavigation() {
  const nav = document.querySelector('.main-nav');
  const toggle = document.querySelector('.menu-toggle');
  if (!nav || !toggle) return;

  if (!navigationEventsInitialized) {
    navigationEventsInitialized = true;
    let lastFocused = null;

    const getFocusable = () =>
      nav.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    const open = (value) => {
      nav.dataset.open = String(value);
      toggle.setAttribute('aria-expanded', String(value));
      if (value) {
        nav.scrollTop = 0;
        lastFocused = document.activeElement;
        const focusables = getFocusable();
        if (focusables.length) {
          focusables[0].focus();
        }
      } else if (lastFocused) {
        toggle.focus();
        lastFocused = null;
      }
    };

    toggle.addEventListener('click', () => open(!(nav.dataset.open === 'true')));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        open(false);
        return;
      }

      if (nav.dataset.open !== 'true' || event.key !== 'Tab') return;

      const focusables = Array.from(getFocusable());
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener('pointerdown', (event) => {
      if (nav.dataset.open !== 'true') return;

      const target = event.target;
      if (!(nav.contains(target) || toggle.contains(target))) {
        open(false);
      }
    });
  }

  syncActiveNavigationLink();
}

function initSearchField() {
  const searchInput = document.querySelector('#q');
  if (!searchInput) return;

  searchInput.setAttribute('autocomplete', 'off');
}

function initSkipLinks() {
  if (skipLinksInitialized) return;
  skipLinksInitialized = true;

  const skipLinks = document.querySelectorAll('.skip-link');
  skipLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetId = link.getAttribute('href')?.substring(1);
      const target = targetId ? document.getElementById(targetId) : null;

      if (target) {
        target.focus();
        target.scrollIntoView({
          behavior: document.documentElement.dataset.reduceMotion === 'true' ? 'auto' : 'smooth',
        });
      }
    });
  });
}

function announcePageChange() {
  const announcer = document.getElementById('page-announcer');
  if (!(announcer instanceof HTMLElement)) return;

  announcer.textContent = '';
  window.setTimeout(() => {
    announcer.textContent = `Loaded ${document.title}`;
  }, 32);
}

function initPerformanceMonitoring() {
  if (performanceMonitoringInitialized) return;
  performanceMonitoringInitialized = true;

  const shouldReportVitals =
    window.__DOUT_DEBUG_VITALS__ === true || localStorage.getItem('debug:vitals') === '1';
  const reportMetric = (metric) => {
    if (!shouldReportVitals) return;
    console.info('[web-vitals]', metric.name, Math.round(metric.value), metric.rating);
  };

  if ('PerformanceObserver' in window) {
    import('web-vitals')
      .then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
        onCLS(reportMetric);
        onFCP(reportMetric);
        onINP(reportMetric);
        onLCP(reportMetric);
        onTTFB(reportMetric);
      })
      .catch(() => {});
  }
}

function initServiceWorker() {
  if (serviceWorkerInitialized) return;
  serviceWorkerInitialized = true;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

function isSearchPage() {
  const path = normalizePathname(window.location.pathname);
  return path === '/search';
}

async function loadSearchModule() {
  if (!searchModulePromise) {
    searchModulePromise = import('./search.js').catch((error) => {
      searchModulePromise = null;
      throw error;
    });
  }

  return searchModulePromise;
}

function warmSearchIndexInBackground() {
  if (isSearchPage() || navigator.connection?.saveData || searchWarmupHandle) return;

  searchWarmupHandle = scheduleIdle(() => {
    searchWarmupHandle = 0;
    loadSearchModule()
      .then((module) => module.preloadSearchIndexes?.())
      .catch(() => {});
  });
}

function markManagedHeadElements(doc = document) {
  doc.head.querySelectorAll(MANAGED_HEAD_SELECTOR).forEach((element) => {
    element.dataset.doutManagedHead = 'true';
  });
}

function replaceManagedHeadElements(nextDocument) {
  markManagedHeadElements(document);
  document.head.querySelectorAll('[data-dout-managed-head="true"]').forEach((element) => {
    element.remove();
  });

  nextDocument.head.querySelectorAll(MANAGED_HEAD_SELECTOR).forEach((element) => {
    const clone = element.cloneNode(true);
    clone.dataset.doutManagedHead = 'true';
    document.head.appendChild(clone);
  });

  document.title = nextDocument.title;
}

function activateScripts(root) {
  if (!root) return;

  root.querySelectorAll('script').forEach((script) => {
    const replacement = document.createElement('script');
    for (const attribute of script.attributes) {
      replacement.setAttribute(attribute.name, attribute.value);
    }
    replacement.textContent = script.textContent;
    script.replaceWith(replacement);
  });
}

function canEnhancePath(pathname) {
  if (!pathname) return false;

  const parts = pathname.split('/');
  const leaf = parts[parts.length - 1] || '';
  return pathname === '/' || leaf === '' || leaf.endsWith('.html') || !leaf.includes('.');
}

async function fetchNextDocument(url, signal) {
  const response = await fetch(url.toString(), {
    signal,
    credentials: 'same-origin',
    headers: { Accept: 'text/html' },
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${url.pathname}`);
  }

  const html = await response.text();
  return new DOMParser().parseFromString(html, 'text/html');
}

function focusAfterNavigation(destination) {
  if (destination.hash) {
    const targetId = decodeURIComponent(destination.hash.slice(1));
    const target = document.getElementById(targetId);
    if (target instanceof HTMLElement) {
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true });
      withInstantScrollBehavior(() => {
        target.scrollIntoView({ block: 'start', inline: 'nearest' });
      });
      return;
    }
  }

  const main = document.getElementById('main');
  if (main instanceof HTMLElement) {
    main.focus({ preventScroll: true });
  }
  withInstantScrollBehavior(() => {
    window.scrollTo({ top: 0, left: 0 });
  });
}

async function hydratePage() {
  initExternalLinks();
  initPostFeedLayout();
  initPostFeedLoadMore();
  initNavigation();
  initSearchField();
  initArticleNavigation();
  initLazyImages();
  initGiscusThemeBridge();
  enhancePixHighlighters(document);

  if (isSearchPage()) {
    const searchModule = await loadSearchModule().catch(() => null);
    await searchModule?.initClientSearch?.();
  } else {
    const loadedSearchModule = searchModulePromise
      ? await searchModulePromise.catch(() => null)
      : null;
    loadedSearchModule?.destroyClientSearch?.();
    cancelIdle(searchWarmupHandle);
    searchWarmupHandle = 0;
    warmSearchIndexInBackground();
  }

  initAnalyticsDashboard();
  trackPageView();
}

async function performEnhancedNavigation(destination, signal) {
  const nextDocument = await fetchNextDocument(destination, signal);
  const currentMain = document.getElementById('main');
  const nextMain = nextDocument.getElementById('main');

  if (!(currentMain instanceof HTMLElement) || !(nextMain instanceof HTMLElement)) {
    throw new Error('Missing main content shell');
  }

  const applySwap = () => {
    replaceManagedHeadElements(nextDocument);
    document.documentElement.lang =
      nextDocument.documentElement.lang || document.documentElement.lang;
    document.body.className = nextDocument.body.className;
    currentMain.replaceWith(nextMain.cloneNode(true));
    activateScripts(document.getElementById('main'));
    closeNavigationMenu();
    syncActiveNavigationLink();
  };

  if (
    'startViewTransition' in document &&
    document.documentElement.dataset.reduceMotion !== 'true'
  ) {
    const transition = document.startViewTransition(() => {
      applySwap();
    });
    await transition.finished;
  } else {
    applySwap();
  }

  await hydratePage();
  focusAfterNavigation(destination);
  announcePageChange();
}

function shouldInterceptNavigation(event) {
  if (!event.canIntercept || event.hashChange || event.downloadRequest || event.formData) {
    return false;
  }

  const destination = new URL(event.destination.url);
  if (destination.origin !== window.location.origin) return false;
  if (!canEnhancePath(destination.pathname)) return false;

  return (
    destination.pathname !== window.location.pathname ||
    destination.search !== window.location.search
  );
}

function initEnhancedNavigation() {
  if (enhancedNavigationInitialized || !('navigation' in window)) return;
  enhancedNavigationInitialized = true;
  markManagedHeadElements(document);

  window.navigation.addEventListener('navigate', (event) => {
    if (!shouldInterceptNavigation(event)) return;

    event.intercept({
      scroll: 'manual',
      handler: async () => {
        const destination = new URL(event.destination.url);
        try {
          await performEnhancedNavigation(destination, event.signal);
        } catch (error) {
          if (error?.name === 'AbortError') return;
          window.location.href = destination.toString();
        }
      },
    });
  });
}

async function bootSite() {
  if (!hasBooted) {
    hasBooted = true;
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    initLegacyThemeBridge();
    initAccentBridge();
    initNavigation();
    initSkipLinks();
    initPerformanceMonitoring();
    initServiceWorker();
    initEnhancedNavigation();
  }

  await hydratePage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void bootSite();
  });
} else {
  void bootSite();
}

export { initNavigation, initSkipLinks };
