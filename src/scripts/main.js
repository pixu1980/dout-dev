/**
 * Main JavaScript for dout.dev
 * Core functionality and utilities
 */

// Import the main stylesheet so Vite emits a CSS asset during build
import '../styles/index.css';
import { initLazyImages } from './lazy-images.js';

// Theme switching functionality
function initThemeSwitcher() {
  const btn = document.querySelector('.theme-switcher');
  if (!btn) return;

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const applyTheme = (theme) => {
    const t = theme === 'auto' ? (prefersDark.matches ? 'dark' : 'light') : theme;
    document.documentElement.dataset.theme = t;
    localStorage.setItem('theme', theme);
    btn.setAttribute('aria-label', `Theme: ${t} (click to toggle)`);
  };

  const saved = localStorage.getItem('theme') || 'auto';
  applyTheme(saved);
  prefersDark.addEventListener('change', () => {
    const current = localStorage.getItem('theme') || 'auto';
    if (current === 'auto') applyTheme('auto');
  });

  btn.addEventListener('click', () => {
    const current = localStorage.getItem('theme') || 'auto';
    const next = current === 'auto' ? 'dark' : current === 'dark' ? 'light' : 'auto';
    applyTheme(next);
  });
}

function initAccentPicker() {
  const dots = document.querySelectorAll('.accent-dot');
  if (!dots.length) return;
  const setAccent = (accent) => {
    if (accent === 'default') document.body.removeAttribute('data-accent');
    else document.body.setAttribute('data-accent', accent);
    localStorage.setItem('accent', accent);
    dots.forEach((d) => {
      d.setAttribute('aria-pressed', String(d.dataset.accent === accent));
    });
  };
  const saved = localStorage.getItem('accent') || 'default';
  setAccent(saved);
  dots.forEach((d) => {
    d.addEventListener('click', () => setAccent(d.dataset.accent));
  });
}

// Navigation enhancements
function initNavigation() {
  const nav = document.querySelector('.main-nav');
  const toggle = document.querySelector('.menu-toggle');
  if (!nav || !toggle) return;
  let lastFocused = null;
  const getFocusable = () =>
    nav.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
  const open = (value) => {
    nav.dataset.open = String(value);
    toggle.setAttribute('aria-expanded', String(value));
    if (value) {
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
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      open(false);
      return true;
    }
    return false;
  };
  const handleFocusTrap = (e) => {
    if (nav.dataset.open !== 'true' || e.key !== 'Tab') return false;
    const focusables = Array.from(getFocusable());
    if (!focusables.length) return false;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
      return true;
    }
    if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
      return true;
    }
    return false;
  };
  document.addEventListener('keydown', (e) => {
    if (handleEscape(e)) return;
    handleFocusTrap(e);
  });
  // Close on outside click (pointer)
  document.addEventListener('pointerdown', (e) => {
    if (nav.dataset.open !== 'true') return;
    const target = e.target;
    if (!(nav.contains(target) || toggle.contains(target))) {
      open(false);
    }
  });
  // Active link
  const path = window.location.pathname;
  nav.querySelectorAll('a').forEach((a) => {
    if (a.getAttribute('href') === path) a.setAttribute('aria-current', 'page');
  });
}

// Search functionality
function initSearch() {
  const searchInput = document.querySelector('#search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    // Basic search implementation
    console.log('Search query:', query);
  });
}

// Code syntax highlighting enhancement
function initCodeHighlighting() {
  const codeBlocks = document.querySelectorAll('pre code');

  codeBlocks.forEach((block) => {
    // Add copy button to code blocks
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.className = 'copy-button';
    copyButton.setAttribute('aria-label', 'Copy code to clipboard');

    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(block.textContent);
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = 'Copy';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    });

    const pre = block.parentElement;
    if (pre && pre.tagName === 'PRE') {
      pre.style.position = 'relative';
      pre.appendChild(copyButton);
    }
  });
}

// Skip link functionality
function initSkipLinks() {
  const skipLinks = document.querySelectorAll('.skip-link');

  skipLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);

      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// Performance monitoring
function initPerformanceMonitoring() {
  // Log Core Web Vitals
  if ('web-vital' in window) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
  }
}

// Service Worker registration
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

// Initialize all functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initThemeSwitcher();
  initAccentPicker();
  initNavigation();
  initSearch();
  initCodeHighlighting();
  initSkipLinks();
  initPerformanceMonitoring();
  initServiceWorker();
  initLazyImages();
});

// Export for testing
export { initThemeSwitcher, initNavigation, initSearch, initCodeHighlighting, initSkipLinks };
