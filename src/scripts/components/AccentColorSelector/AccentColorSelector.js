/**
 * AccentColorSelector - Custom Element for accent color selection.
 * Manages 5 pastel accent color options with accessibility support.
 */

import cssText from 'bundle-text:./AccentColorSelector.css';

const STORAGE_KEY = 'accent-color';
const ELEMENT_NAME = 'accent-color-selector';

// 5 Pastel Accent Options with accessible contrast ratios
// Each color works well in both light and dark modes
const ACCENT_OPTIONS = [
  { id: 'coral', label: 'Coral', h: 16, s: 95, l: 58 },
  { id: 'rose', label: 'Rose', h: 340, s: 90, l: 62 },
  { id: 'lavender', label: 'Lavender', h: 280, s: 85, l: 65 }, // Soft lavender
  { id: 'sky', label: 'Sky', h: 200, s: 85, l: 62 },
  { id: 'mint', label: 'Mint', h: 145, s: 80, l: 60 },
];

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

class AccentColorSelector extends HTMLElement {
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
    this._onKeydown = this._onKeydown.bind(this);
    this.currentAccent = this.getInitialAccent();
  }

  connectedCallback() {
    this.constructor.ensureComponentStyles();
    this.render();
    this.attachEventListeners();
  }

  render() {
    const template = document.createElement('template');
    this.textContent = '';
    const buttonsHTML = ACCENT_OPTIONS.map(
      (option) => `
      <button
        type="button"
        class="accent-button"
        data-accent="${option.id}"
        aria-label="Accent color: ${option.label}"
        aria-checked="false"
        role="radio"
        tabindex="-1"
        title="${option.label}"
        style="--dout--accent-preview-h: ${option.h}; --dout--accent-preview-s: ${option.s}%; --dout--accent-preview-l: ${option.l}%"
      ></button>
    `
    ).join('');

    template.innerHTML = `
      <div class="accent-selector" role="radiogroup" aria-label="Accent color selection">
        <span class="accent-selector-label">Color:</span>
        ${buttonsHTML}
      </div>
    `;

    this.appendChild(template.content.cloneNode(true));
    this._buttons = Array.from(this.querySelectorAll('.accent-button'));
    this.applyAccent(this.currentAccent);
  }

  attachEventListeners() {
    this._buttons?.forEach((button) => {
      button.addEventListener('click', this._onChange);
      button.addEventListener('keydown', this._onKeydown);
    });
  }

  disconnectedCallback() {
    this._buttons?.forEach((button) => {
      button.removeEventListener('click', this._onChange);
      button.removeEventListener('keydown', this._onKeydown);
    });
  }

  getSavedAccent() {
    const saved = getStorage()?.getItem(STORAGE_KEY);
    return ACCENT_OPTIONS.some((option) => option.id === saved) ? saved : null;
  }

  getInitialAccent() {
    return this.getSavedAccent() || 'coral';
  }

  getAccentValues(accentId) {
    const option = ACCENT_OPTIONS.find((accentOption) => accentOption.id === accentId);
    return option || ACCENT_OPTIONS[0];
  }

  updateButtonState() {
    this._buttons?.forEach((button) => {
      const isActive = button.dataset.accent === this.currentAccent;
      button.setAttribute('aria-checked', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });
  }

  applyAccent(accentId) {
    const accent = this.getAccentValues(accentId);
    const root = document.documentElement;

    this.currentAccent = accent.id;
    getStorage()?.setItem(STORAGE_KEY, accent.id);

    // Update CSS custom properties for the new accent
    root.style.setProperty('--dout--accent-h', accent.h);
    root.style.setProperty('--dout--accent-s', `${accent.s}%`);
    root.style.setProperty('--dout--accent-l', `${accent.l}%`);

    this.updateButtonState();

    // Dispatch custom event for external listeners
    this.dispatchEvent(
      new CustomEvent('accent-changed', {
        detail: { accentId: accent.id, label: accent.label },
        bubbles: true,
      })
    );
  }

  _onChange(event) {
    const accentId = event.currentTarget.dataset.accent;
    this.applyAccent(accentId);
  }

  _onKeydown(event) {
    const currentIndex = this._buttons.indexOf(event.currentTarget);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % this._buttons.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + this._buttons.length) % this._buttons.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = this._buttons.length - 1;
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        this.applyAccent(event.currentTarget.dataset.accent);
        return;
      default:
        return;
    }

    event.preventDefault();
    const nextButton = this._buttons[nextIndex];
    nextButton?.focus();
    if (nextButton) {
      this.applyAccent(nextButton.dataset.accent);
    }
  }
}

export { ACCENT_OPTIONS, AccentColorSelector, STORAGE_KEY };

export default AccentColorSelector;
