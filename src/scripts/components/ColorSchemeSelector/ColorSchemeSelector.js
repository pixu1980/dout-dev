/**
 * ColorSchemeSelector - Custom Element for color scheme selection.
 * Manages light, dark, and system color scheme preferences.
 */

import cssText from 'bundle-text:./ColorSchemeSelector.css';

const STORAGE_KEY = 'color-scheme';
const SCHEMES = ['light', 'dark', 'system'];
const ELEMENT_NAME = 'color-scheme-switcher';

const META_CONTENT = {
  light: 'light',
  dark: 'dark',
  system: 'light dark',
};

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

let componentStyleSheet = null;

function adoptComponentStyles() {
  if (
    typeof document === 'undefined' ||
    !('adoptedStyleSheets' in document) ||
    typeof globalThis.CSSStyleSheet !== 'function' ||
    typeof globalThis.CSSStyleSheet.prototype.replaceSync !== 'function'
  ) {
    return null;
  }

  if (!componentStyleSheet) {
    componentStyleSheet = new CSSStyleSheet();
    componentStyleSheet.replaceSync(cssText);
  }

  if (!document.adoptedStyleSheets.includes(componentStyleSheet)) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, componentStyleSheet];
  }

  return componentStyleSheet;
}

class ColorSchemeSelector extends HTMLElement {
  static ensureComponentStyles() {
    return adoptComponentStyles();
  }

  static {
    this.ensureComponentStyles();
    !globalThis.customElements?.get(ELEMENT_NAME) &&
      globalThis.customElements.define(ELEMENT_NAME, this);
  }

  constructor() {
    super();
    this._onChange = this._onChange.bind(this);
    this.currentScheme = this.getInitialScheme();
  }

  connectedCallback() {
    this.constructor.ensureComponentStyles();
    this.render();
    this.attachEventListeners();
  }

  render() {
    const template = document.createElement('template');
    this.textContent = '';
    template.innerHTML = `
      <section class="color-scheme-selector" aria-label="Color scheme selection" role="radiogroup">
        <label data-scheme="light" aria-label="Light mode">
          <input type="radio" name="color-scheme" value="light" />
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="currentColor"/><path stroke="currentColor" stroke-width="2" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <span class="sr-only">Light</span>
        </label>

        <label data-scheme="dark" aria-label="Dark mode">
          <input type="radio" name="color-scheme" value="dark" />
          <svg aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79"/></svg>
          <span class="sr-only">Dark</span>
        </label>

        <label data-scheme="system" aria-label="System preference">
          <input type="radio" name="color-scheme" value="system" />
          <svg aria-hidden="true" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="3" fill="none" stroke="currentColor" stroke-width="2" rx="2" ry="2"/><path stroke="currentColor" stroke-width="2" d="M8 21h8m-4-4v4"/></svg>
          <span class="sr-only">System</span>
        </label>
      </section>
    `;

    this.appendChild(template.content.cloneNode(true));
    this._inputs = Array.from(this.querySelectorAll('input[name="color-scheme"]'));
    this._options = Array.from(this.querySelectorAll('label'));
    this.applyScheme(this.currentScheme);
  }

  attachEventListeners() {
    this._inputs?.forEach((input) => {
      input.addEventListener('change', this._onChange);
    });
  }

  disconnectedCallback() {
    this._inputs?.forEach((input) => {
      input.removeEventListener('change', this._onChange);
    });
  }

  getOrCreateMeta() {
    const existing = document.querySelector('meta[name="color-scheme"]');
    if (existing) return existing;

    const meta = document.createElement('meta');
    meta.setAttribute('name', 'color-scheme');
    document.head.appendChild(meta);
    return meta;
  }

  getSavedScheme() {
    const saved = getStorage()?.getItem(STORAGE_KEY);
    return SCHEMES.includes(saved) ? saved : null;
  }

  getSchemeFromMeta() {
    const meta = document.querySelector('meta[name="color-scheme"]');
    const content = meta?.getAttribute('content') || '';

    if (content === 'light') return 'light';
    if (content === 'dark') return 'dark';
    return 'system';
  }

  getInitialScheme() {
    return this.getSavedScheme() || this.getSchemeFromMeta() || 'system';
  }

  updateOptionState() {
    const current = this.querySelector(`input[value="${this.currentScheme}"]`);
    if (current) {
      current.checked = true;
    }

    this._options?.forEach((option) => {
      const input = option.querySelector('input');
      option.toggleAttribute('data-active', input?.value === this.currentScheme);
    });
  }

  applyScheme(scheme) {
    const normalized = SCHEMES.includes(scheme) ? scheme : 'system';
    const meta = this.getOrCreateMeta();
    const root = document.documentElement;

    this.currentScheme = normalized;
    getStorage()?.setItem(STORAGE_KEY, normalized);
    meta.setAttribute('content', META_CONTENT[this.currentScheme]);

    if (this.currentScheme === 'system') {
      root.removeAttribute('data-color-scheme');
      root.style.colorScheme = 'light dark';
    } else {
      root.setAttribute('data-color-scheme', this.currentScheme);
      root.style.colorScheme = this.currentScheme;
    }

    this.updateOptionState();
  }

  _onChange(event) {
    const value = event.target.value;
    this.applyScheme(value);
  }
}

export { ColorSchemeSelector, META_CONTENT, SCHEMES, STORAGE_KEY };

export default ColorSchemeSelector;
