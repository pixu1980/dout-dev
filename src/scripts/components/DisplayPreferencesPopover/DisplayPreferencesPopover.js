/**
 * DisplayPreferencesPopover - Custom Element for display and accessibility settings.
 * Exposes a native popover panel that persists UI preferences in local storage.
 */

import '../AccentColorSelector/AccentColorSelector.js';
import cssText from 'bundle-text:./DisplayPreferencesPopover.css';

const STORAGE_KEY = 'display-preferences';
const ELEMENT_NAME = 'display-preferences-popover';
const FONT_SCALE_OPTIONS = ['75%', '80%', '90%', '100%', '110%', '120%', '125%'];
const RADIUS_PRESET_OPTIONS = [
  {
    description: 'Zero radius, sharp edges across cards and controls.',
    id: 'square',
    label: 'Square',
  },
  {
    description: 'A restrained 4px radius for the full interface.',
    id: 'rounded',
    label: 'Rounded',
  },
  {
    description: 'A softer superellipse silhouette for a more sculpted UI.',
    id: 'squircle',
    label: 'Squircle',
  },
];
const ACCESSIBILITY_OPTIONS = [
  {
    attribute: 'data-reduce-motion',
    description: 'Tone down movement-heavy interactions.',
    label: 'Reduce motion',
    name: 'reduceMotion',
  },
  {
    attribute: 'data-reduce-animations',
    description: 'Minimize fades, transitions, and animated reveals.',
    label: 'Reduce animations',
    name: 'reduceAnimations',
  },
  {
    attribute: 'data-reduce-transparency',
    description: 'Swap blurred glass surfaces for solid layers.',
    label: 'Reduce transparency',
    name: 'reduceTransparency',
  },
  {
    attribute: 'data-increase-contrast',
    description: 'Boost text, borders, and surface separation.',
    label: 'Increase contrast',
    name: 'increaseContrast',
  },
];

const HEADING_FONT_OPTIONS = [
  {
    id: 'editorial-serif',
    label: 'Editorial Serif',
    stack: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif",
  },
  {
    id: 'humanist-sans',
    label: 'Humanist Sans',
    stack: "'Avenir Next', 'Segoe UI Variable Text', 'Helvetica Neue', sans-serif",
  },
  {
    id: 'system-sans',
    label: 'System Sans',
    stack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  {
    id: 'book-serif',
    label: 'Book Serif',
    stack: "Baskerville, 'Times New Roman', Georgia, serif",
  },
  {
    id: 'rounded-sans',
    label: 'Rounded Sans',
    stack: "Optima, Candara, 'Trebuchet MS', 'Gill Sans', sans-serif",
  },
];

const BODY_FONT_OPTIONS = [
  {
    id: 'humanist-sans',
    label: 'Humanist Sans',
    stack: "'Avenir Next', 'Segoe UI Variable Text', 'Helvetica Neue', sans-serif",
  },
  {
    id: 'system-sans',
    label: 'System Sans',
    stack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  {
    id: 'book-serif',
    label: 'Book Serif',
    stack: "Georgia, Cambria, 'Times New Roman', serif",
  },
  {
    id: 'editorial-serif',
    label: 'Editorial Serif',
    stack: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif",
  },
  {
    id: 'readable-serif',
    label: 'Readable Serif',
    stack: "Charter, 'Bitstream Charter', 'Sitka Text', Georgia, serif",
  },
];

const CODE_FONT_OPTIONS = [
  {
    id: 'plex-mono',
    label: 'Plex Mono',
    stack: "'IBM Plex Mono', 'SFMono-Regular', 'Cascadia Code', Consolas, monospace",
  },
  {
    id: 'system-mono',
    label: 'System Mono',
    stack: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
  },
  {
    id: 'cascadia-mono',
    label: 'Cascadia Mono',
    stack: "'Cascadia Code', 'SFMono-Regular', Menlo, Consolas, monospace",
  },
  {
    id: 'classic-mono',
    label: 'Classic Mono',
    stack: "'Courier New', Courier, monospace",
  },
];

const FONT_OPTIONS = {
  bodyFont: BODY_FONT_OPTIONS,
  codeFont: CODE_FONT_OPTIONS,
  headingFont: HEADING_FONT_OPTIONS,
};

const DEFAULT_PREFERENCES = Object.freeze({
  bodyFont: 'humanist-sans',
  codeFont: 'plex-mono',
  fontScale: '100%',
  headingFont: 'editorial-serif',
  increaseContrast: false,
  radiusPreset: 'rounded',
  reduceAnimations: false,
  reduceMotion: false,
  reduceTransparency: false,
});

let componentStyleSheet = null;
let popoverCount = 0;

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

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

function findFontOption(groupName, optionId) {
  const options = FONT_OPTIONS[groupName] || [];
  return options.find((option) => option.id === optionId) || options[0];
}

function findRadiusPreset(optionId) {
  return (
    RADIUS_PRESET_OPTIONS.find((option) => option.id === optionId) ||
    RADIUS_PRESET_OPTIONS.find((option) => option.id === DEFAULT_PREFERENCES.radiusPreset)
  );
}

function normalizePreferences(preferences = {}) {
  const candidate = preferences && typeof preferences === 'object' ? preferences : {};

  return {
    bodyFont: findFontOption('bodyFont', candidate.bodyFont).id,
    codeFont: findFontOption('codeFont', candidate.codeFont).id,
    fontScale: FONT_SCALE_OPTIONS.includes(candidate.fontScale)
      ? candidate.fontScale
      : DEFAULT_PREFERENCES.fontScale,
    headingFont: findFontOption('headingFont', candidate.headingFont).id,
    increaseContrast: candidate.increaseContrast === true,
    radiusPreset: findRadiusPreset(candidate.radiusPreset).id,
    reduceAnimations: candidate.reduceAnimations === true,
    reduceMotion: candidate.reduceMotion === true,
    reduceTransparency: candidate.reduceTransparency === true,
  };
}

function readPreferences() {
  const raw = getStorage()?.getItem(STORAGE_KEY);

  if (!raw) {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    return normalizePreferences(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

function writePreferences(preferences) {
  const normalized = normalizePreferences(preferences);

  getStorage()?.setItem(STORAGE_KEY, JSON.stringify(normalized));

  return normalized;
}

function toggleDocumentPreference(root, attributeName, isEnabled) {
  if (isEnabled) {
    root.setAttribute(attributeName, 'true');
    return;
  }

  root.removeAttribute(attributeName);
}

function applyPreferencesToDocument(preferences) {
  const normalized = normalizePreferences(preferences);

  if (typeof document === 'undefined') {
    return normalized;
  }

  const root = document.documentElement;

  if (!root) {
    return normalized;
  }

  ACCESSIBILITY_OPTIONS.forEach((option) => {
    toggleDocumentPreference(root, option.attribute, normalized[option.name]);
  });

  if (normalized.fontScale === DEFAULT_PREFERENCES.fontScale) {
    root.style.removeProperty('font-size');
  } else {
    root.style.fontSize = normalized.fontScale;
  }

  root.style.setProperty(
    '--dout--font-display',
    findFontOption('headingFont', normalized.headingFont).stack
  );
  root.style.setProperty(
    '--dout--font-sans',
    findFontOption('bodyFont', normalized.bodyFont).stack
  );
  root.style.setProperty(
    '--dout--font-mono',
    findFontOption('codeFont', normalized.codeFont).stack
  );
  root.setAttribute('data-radius-preset', normalized.radiusPreset);

  return normalized;
}

function renderSelectOptions(options, selectedValue) {
  return options
    .map((option) => {
      const selected = option.id === selectedValue ? ' selected' : '';
      return `<option value="${option.id}"${selected}>${option.label}</option>`;
    })
    .join('');
}

function renderScaleOptions(selectedValue) {
  return FONT_SCALE_OPTIONS.map((option) => {
    const selected = option === selectedValue ? ' selected' : '';
    return `<option value="${option}"${selected}>${option}</option>`;
  }).join('');
}

function renderRadiusPresetControls(panelId, selectedValue) {
  return RADIUS_PRESET_OPTIONS.map((option) => {
    const checked = option.id === selectedValue ? ' checked' : '';
    const inputId = `${panelId}-radius-${option.id}`;

    return `
      <label class="preferences-choice" for="${inputId}">
        <input id="${inputId}" type="radio" name="radiusPreset" value="${option.id}"${checked} />
        <span class="preferences-choice__preview" data-radius-preview="${option.id}" aria-hidden="true">
          <span></span>
          <span></span>
        </span>
        <span class="preferences-choice__copy">
          <span class="preferences-choice__label">${option.label}</span>
          <span class="preferences-choice__hint">${option.description}</span>
        </span>
      </label>
    `;
  }).join('');
}

function renderAccessibilityOptions(panelId, preferences) {
  return ACCESSIBILITY_OPTIONS.map((option) => {
    const checked = preferences[option.name] ? ' checked' : '';
    const inputId = `${panelId}-${option.name}`;

    return `
      <div class="preferences-checkbox">
        <input id="${inputId}" type="checkbox" name="${option.name}"${checked} />
        <label class="preferences-checkbox__copy" for="${inputId}">
          <span class="preferences-checkbox__label">${option.label}</span>
          <span class="preferences-checkbox__hint">${option.description}</span>
        </label>
      </div>
    `;
  }).join('');
}

function scheduleFrame(callback) {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(callback);
    return;
  }

  globalThis.setTimeout(callback, 0);
}

class DisplayPreferencesPopover extends HTMLElement {
  static ensureComponentStyles() {
    return adoptComponentStyles();
  }

  static {
    this.ensureComponentStyles();
    applyPreferencesToDocument(readPreferences());
    !globalThis.customElements?.get(ELEMENT_NAME) &&
      globalThis.customElements.define(ELEMENT_NAME, this);
  }

  constructor() {
    super();
    this._onDocumentKeydown = this._onDocumentKeydown.bind(this);
    this._onDocumentPointerDown = this._onDocumentPointerDown.bind(this);
    this._onFallbackToggle = this._onFallbackToggle.bind(this);
    this._onPopoverToggle = this._onPopoverToggle.bind(this);
    this._onPreferenceChange = this._onPreferenceChange.bind(this);
    this._onWindowResize = this._onWindowResize.bind(this);

    this.preferences = applyPreferencesToDocument(readPreferences());

    popoverCount += 1;
    this._panelId = `display-preferences-panel-${popoverCount}`;
    this._titleId = `${this._panelId}-title`;
    this._supportsPopover = false;
  }

  connectedCallback() {
    this.constructor.ensureComponentStyles();
    this.preferences = applyPreferencesToDocument(readPreferences());
    this.render();
    this.attachEventListeners();
    this.syncFormControls();
    this.syncOpenState(false);
  }

  disconnectedCallback() {
    this._toggleButton?.removeEventListener('click', this._onFallbackToggle);
    this._panel?.removeEventListener('toggle', this._onPopoverToggle);
    this._controls?.forEach((control) => {
      control.removeEventListener('change', this._onPreferenceChange);
    });
    document.removeEventListener('keydown', this._onDocumentKeydown);
    document.removeEventListener('pointerdown', this._onDocumentPointerDown);
    window.removeEventListener('resize', this._onWindowResize);
  }

  render() {
    const template = document.createElement('template');
    this.textContent = '';
    template.innerHTML = `
      <div class="preferences-shell">
        <button
          type="button"
          class="preferences-toggle"
          popovertarget="${this._panelId}"
          popovertargetaction="toggle"
          aria-controls="${this._panelId}"
          aria-expanded="false"
          aria-haspopup="dialog"
          aria-label="Open display preferences"
          title="Display preferences"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M6 9.5 12 15.5 18 9.5"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            />
          </svg>
          <span class="sr-only">Display preferences</span>
        </button>

        <section
          id="${this._panelId}"
          class="preferences-panel"
          popover="auto"
          role="dialog"
          tabindex="-1"
          aria-labelledby="${this._titleId}"
        >
          <header class="preferences-panel__header">
            <p class="preferences-panel__eyebrow">Interface settings</p>
            <h2 id="${this._titleId}">Display preferences</h2>
            <p class="preferences-panel__lede">
              Adjust accent color, accessibility, and typography without leaving the page.
            </p>
          </header>

          <section class="preferences-group" aria-labelledby="${this._panelId}-accent">
            <div class="preferences-group__title">
              <h3 id="${this._panelId}-accent">Accent color</h3>
              <p>Pick the accent palette used by buttons, links, and highlights.</p>
            </div>
            <accent-color-selector></accent-color-selector>
          </section>

          <section class="preferences-group" aria-labelledby="${this._panelId}-shape">
            <div class="preferences-group__title">
              <h3 id="${this._panelId}-shape">Corners</h3>
              <p>Switch between sharp, restrained, and sculpted corners with a stronger visual delta.</p>
            </div>

            <div class="preferences-choice-grid" role="radiogroup" aria-labelledby="${this._panelId}-shape">
              ${renderRadiusPresetControls(this._panelId, this.preferences.radiusPreset)}
            </div>
          </section>

          <fieldset class="preferences-group preferences-group--fieldset">
            <legend>Accessibility</legend>
            <div class="preferences-checklist">
              ${renderAccessibilityOptions(this._panelId, this.preferences)}
            </div>
          </fieldset>

          <section class="preferences-group" aria-labelledby="${this._panelId}-type">
            <div class="preferences-group__title">
              <h3 id="${this._panelId}-type">Typography</h3>
              <p>Tune the scale and font stacks for headings, body copy, and code blocks.</p>
            </div>

            <div class="preferences-grid">
              <div class="preferences-field">
                <label for="${this._panelId}-font-scale">Font size</label>
                <select id="${this._panelId}-font-scale" name="fontScale">
                  ${renderScaleOptions(this.preferences.fontScale)}
                </select>
              </div>

              <div class="preferences-field">
                <label for="${this._panelId}-heading-font">Heading font</label>
                <select id="${this._panelId}-heading-font" name="headingFont">
                  ${renderSelectOptions(HEADING_FONT_OPTIONS, this.preferences.headingFont)}
                </select>
              </div>

              <div class="preferences-field">
                <label for="${this._panelId}-body-font">Body font</label>
                <select id="${this._panelId}-body-font" name="bodyFont">
                  ${renderSelectOptions(BODY_FONT_OPTIONS, this.preferences.bodyFont)}
                </select>
              </div>

              <div class="preferences-field">
                <label for="${this._panelId}-code-font">Code font</label>
                <select id="${this._panelId}-code-font" name="codeFont">
                  ${renderSelectOptions(CODE_FONT_OPTIONS, this.preferences.codeFont)}
                </select>
              </div>
            </div>
          </section>
        </section>
      </div>
    `;

    this.appendChild(template.content.cloneNode(true));

    this._toggleButton = this.querySelector('.preferences-toggle');
    this._panel = this.querySelector('.preferences-panel');
    this._controls = Array.from(this.querySelectorAll('input[name], select[name]'));
    this._supportsPopover =
      typeof this._panel?.showPopover === 'function' &&
      typeof this._panel?.hidePopover === 'function';
  }

  attachEventListeners() {
    if (!this._supportsPopover) {
      this._toggleButton?.addEventListener('click', this._onFallbackToggle);
      document.addEventListener('keydown', this._onDocumentKeydown);
      document.addEventListener('pointerdown', this._onDocumentPointerDown);
    } else {
      this._panel?.addEventListener('toggle', this._onPopoverToggle);
    }

    this._controls?.forEach((control) => {
      control.addEventListener('change', this._onPreferenceChange);
    });

    window.addEventListener('resize', this._onWindowResize);
  }

  isOpen() {
    if (!this._panel) {
      return false;
    }

    if (this._supportsPopover) {
      return this._panel.matches(':popover-open');
    }

    return this.dataset.open === 'true';
  }

  queuePanelPositionUpdate() {
    if (!this.isOpen()) {
      return;
    }

    scheduleFrame(() => this.updatePanelPosition());
  }

  updatePanelPosition() {
    if (!this.isOpen() || !this._panel || !this._toggleButton) {
      return;
    }

    const spacing = 12;
    const buttonRect = this._toggleButton.getBoundingClientRect();
    const panelRect = this._panel.getBoundingClientRect();
    const panelWidth = panelRect.width || 360;
    const panelHeight = panelRect.height || 0;
    const left = Math.max(
      spacing,
      Math.min(buttonRect.right - panelWidth, window.innerWidth - panelWidth - spacing)
    );
    const preferredTop = buttonRect.bottom + spacing;
    const top =
      preferredTop + panelHeight <= window.innerHeight - spacing
        ? preferredTop
        : Math.max(spacing, buttonRect.top - panelHeight - spacing);

    this._panel.style.left = `${Math.round(left)}px`;
    this._panel.style.top = `${Math.round(top)}px`;
  }

  syncFormControls() {
    this._controls?.forEach((control) => {
      if (control instanceof HTMLInputElement && control.type === 'checkbox') {
        control.checked = this.preferences[control.name] === true;
        return;
      }

      if (control instanceof HTMLInputElement && control.type === 'radio') {
        control.checked = control.value === this.preferences[control.name];
        control
          .closest('.preferences-choice')
          ?.setAttribute('data-selected', String(control.checked));
        return;
      }

      control.value = this.preferences[control.name];
    });
  }

  syncOpenState(isOpen) {
    this.dataset.open = String(isOpen);
    this._toggleButton?.setAttribute('aria-expanded', String(isOpen));

    if (!this._supportsPopover && this._panel) {
      this._panel.setAttribute('aria-hidden', String(!isOpen));
      this._panel.setAttribute('data-open', String(isOpen));
    }

    if (isOpen) {
      this._panel?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
      if (this._panel) {
        this._panel.scrollTop = 0;
      }
      this.queuePanelPositionUpdate();
    }
  }

  updatePreference(name, value) {
    this.preferences = applyPreferencesToDocument({
      ...this.preferences,
      [name]: value,
    });
    this.preferences = writePreferences(this.preferences);
    this.syncFormControls();
    this.queuePanelPositionUpdate();
  }

  _onDocumentKeydown(event) {
    if (event.key !== 'Escape' || !this.isOpen()) {
      return;
    }

    this.syncOpenState(false);
    this._toggleButton?.focus();
  }

  _onDocumentPointerDown(event) {
    if (!this.isOpen()) {
      return;
    }

    const target = event.target;

    if (this.contains(target)) {
      return;
    }

    this.syncOpenState(false);
  }

  _onFallbackToggle(event) {
    if (this._supportsPopover) {
      return;
    }

    event.preventDefault();
    this.syncOpenState(!this.isOpen());
  }

  _onPopoverToggle() {
    this.syncOpenState(this._panel.matches(':popover-open'));
  }

  _onPreferenceChange(event) {
    const target = event.currentTarget;
    const value =
      target instanceof HTMLInputElement && target.type === 'checkbox'
        ? target.checked
        : target.value;

    this.updatePreference(target.name, value);
  }

  _onWindowResize() {
    this.queuePanelPositionUpdate();
  }
}

export {
  ACCESSIBILITY_OPTIONS,
  CODE_FONT_OPTIONS,
  DEFAULT_PREFERENCES,
  DisplayPreferencesPopover,
  BODY_FONT_OPTIONS,
  FONT_SCALE_OPTIONS,
  HEADING_FONT_OPTIONS,
  RADIUS_PRESET_OPTIONS,
  STORAGE_KEY,
  applyPreferencesToDocument,
  readPreferences,
};

export default DisplayPreferencesPopover;
