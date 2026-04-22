/**
 * <pre is="pix-highlighter" data-lang="js|ts|css|json|html|python|rust|c|cpp|php|csharp|go|markdown|md|yml|yaml|bash|sh"><code>...</code></pre>
 * - Uses the CSS Custom Highlight API with CSS-defined themes.
 * - Falls back to token spans when the API is not supported.
 * - Exposes a copy action and a page-wide theme selector on every instance.
 */
import mainCssText from 'bundle-text:./PixHighlighter.css';
import cyberpunkThemeCssText from 'bundle-text:./Themes/cyberpunk.css';
import darculaThemeCssText from 'bundle-text:./Themes/darcula.css';
import defaultThemeCssText from 'bundle-text:./Themes/default.css';
import prettyLightsThemeCssText from 'bundle-text:./Themes/prettylights.css';
import prismThemeCssText from 'bundle-text:./Themes/prism.css';
import themeDefaultsCssText from 'bundle-text:./Themes/theme-defaults.css';

import {
  TOKEN_TYPES,
  getLexer,
  lexBash,
  lexC,
  lexCPP,
  lexCSharp,
  lexCSS,
  lexGo,
  lexHTML,
  lexJS,
  lexJSON,
  lexMarkdown,
  lexPHP,
  lexPython,
  lexRust,
  lexTS,
  lexYAML,
  normalizeLang,
} from './Lexers/index.js';

const COMPONENT_STYLE_TEXT = [
  themeDefaultsCssText,
  defaultThemeCssText,
  prismThemeCssText,
  prettyLightsThemeCssText,
  darculaThemeCssText,
  cyberpunkThemeCssText,
  mainCssText,
].join('\n');

const COPY_RESET_DELAY = 2000;
const THEME_MENU_OFFSET = 8;
const THEME_MENU_VIEWPORT_MARGIN = 12;
const THEME_STORAGE_KEY = 'pix-highlighter-theme';
const ENHANCED_MARKER = Symbol('pixHighlighterEnhanced');
const COMPONENT_STYLE_ATTRIBUTE = 'data-pix-highlighter-styles';
let componentStyleSheet = null;
let componentStyleElement = null;

function supportsAnchorPositioning() {
  if (typeof globalThis.CSS?.supports !== 'function') {
    return false;
  }

  try {
    return (
      globalThis.CSS.supports('anchor-name: --dout--pix-anchor') &&
      globalThis.CSS.supports('position-anchor: --dout--pix-anchor') &&
      globalThis.CSS.supports('top: anchor(bottom)')
    );
  } catch {
    return false;
  }
}

function removeFallbackStyleElement() {
  componentStyleElement?.remove();
}

function ensureFallbackStyleElement() {
  if (typeof document === 'undefined') {
    return null;
  }

  componentStyleElement ||=
    document.head?.querySelector(`style[${COMPONENT_STYLE_ATTRIBUTE}]`) ||
    document.querySelector(`style[${COMPONENT_STYLE_ATTRIBUTE}]`) ||
    document.createElement('style');

  componentStyleElement.setAttribute(COMPONENT_STYLE_ATTRIBUTE, '');
  if (componentStyleElement.textContent !== COMPONENT_STYLE_TEXT) {
    componentStyleElement.textContent = COMPONENT_STYLE_TEXT;
  }

  if (!componentStyleElement.isConnected) {
    (document.head || document.documentElement).appendChild(componentStyleElement);
  }

  return componentStyleElement;
}

function adoptComponentStyles() {
  if (typeof document === 'undefined') {
    return null;
  }

  const supportsAdoptedStyleSheets =
    'adoptedStyleSheets' in document &&
    typeof globalThis.CSSStyleSheet === 'function' &&
    typeof globalThis.CSSStyleSheet.prototype.replaceSync === 'function';

  if (!supportsAdoptedStyleSheets) {
    return ensureFallbackStyleElement();
  }

  removeFallbackStyleElement();

  if (!componentStyleSheet) {
    componentStyleSheet = new CSSStyleSheet();
    componentStyleSheet.replaceSync(COMPONENT_STYLE_TEXT);
  }

  if (!document.adoptedStyleSheets.includes(componentStyleSheet)) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, componentStyleSheet];
  }

  return componentStyleSheet;
}

const PIX_HIGHLIGHTER_THEME_OPTIONS = Object.freeze([
  { value: 'default', label: 'Default' },
  { value: 'prism', label: 'Prism' },
  { value: 'prettylights', label: 'Pretty Lights' },
  { value: 'darcula', label: 'Darcula' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
]);

const COPY_ICON = `
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><rect width="10" height="10" x="9" y="9" fill="none" stroke="currentColor" stroke-width="1.8" rx="2" ry="2"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"/></svg>
`;

const CHECK_ICON = `
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12.5 9.2 17 19 7.5"/></svg>
`;

const ERROR_ICON = `
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" d="M12 7.5V13"/><circle cx="12" cy="16.5" r="1" fill="currentColor"/></svg>
`;

const PALETTE_ICON = `
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.6" d="M12 3c-5 0-9 3.6-9 8.2 0 4.4 3.6 7.8 8 7.8h1.5c.8 0 1.5.6 1.5 1.4 0 .9.7 1.6 1.6 1.6 3 0 5.4-2.7 5.4-6.2C21 8.2 17 3 12 3Z"/><circle cx="7.5" cy="11" r="1.1" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.1" fill="currentColor"/><circle cx="15" cy="7.8" r="1.1" fill="currentColor"/><circle cx="17" cy="12" r="1.1" fill="currentColor"/></svg>
`;

const CHEVRON_ICON = `
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="m6 9 6 6 6-6"/></svg>
`;

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getThemeLabel(theme) {
  return PIX_HIGHLIGHTER_THEME_OPTIONS.find((option) => option.value === theme)?.label || 'Default';
}

function setIconButtonContent(button, iconMarkup, label) {
  if (!button) return;
  button.innerHTML = `${iconMarkup}<span class="pix-highlighter__sr-only">${label}</span>`;
  button.setAttribute('aria-label', label);
  button.title = label;
}

class PixHighlighter extends HTMLPreElement {
  static _uid = 0;
  static instances = new Set();
  static KNOWN_TYPES = TOKEN_TYPES;
  static _themeInitialized = false;

  static ensureComponentStyles() {
    return adoptComponentStyles();
  }

  static registerCustomElement() {
    const registry = globalThis.customElements;
    if (!registry?.define) {
      return false;
    }

    if (registry.get('pix-highlighter')) {
      return true;
    }

    try {
      registry.define('pix-highlighter', this, { extends: 'pre' });
      return true;
    } catch {
      return false;
    }
  }

  static {
    this.ensureComponentStyles();

    this.registerCustomElement();

    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootPixHighlighters, { once: true });
      } else {
        queueMicrotask(bootPixHighlighters);
      }
    }
  }

  static get observedAttributes() {
    return ['data-lang', 'lang'];
  }

  static supportsHighlights() {
    return !!(
      typeof window !== 'undefined' &&
      globalThis.CSS?.highlights &&
      typeof window.Highlight === 'function'
    );
  }

  static getHighlightName(type) {
    return `pix-${type}`;
  }

  static isThemeValue(theme) {
    return PIX_HIGHLIGHTER_THEME_OPTIONS.some((option) => option.value === theme);
  }

  static getSavedTheme() {
    const savedTheme = getStorage()?.getItem(THEME_STORAGE_KEY);
    return this.isThemeValue(savedTheme) ? savedTheme : null;
  }

  static getCurrentTheme() {
    if (typeof document === 'undefined') return 'default';
    const currentTheme = document.documentElement.dataset.pixHighlighterTheme;
    return this.isThemeValue(currentTheme) ? currentTheme : 'default';
  }

  static getInitialTheme() {
    if (typeof document === 'undefined') return 'default';
    const attributeTheme = document.documentElement.dataset.pixHighlighterTheme;
    if (this.isThemeValue(attributeTheme)) return attributeTheme;
    return this.getSavedTheme() || 'default';
  }

  static ensureThemeState() {
    if (this._themeInitialized) return;
    this._themeInitialized = true;
    this.applyTheme(this.getInitialTheme(), { persist: false, syncInstances: false });
  }

  static applyTheme(theme, { persist = true, syncInstances = true } = {}) {
    const normalizedTheme = this.isThemeValue(theme) ? theme : 'default';

    if (typeof document !== 'undefined') {
      document.documentElement.dataset.pixHighlighterTheme = normalizedTheme;
    }

    if (persist) {
      getStorage()?.setItem(THEME_STORAGE_KEY, normalizedTheme);
    }

    if (syncInstances) {
      for (const instance of this.instances) {
        instance._syncThemeControl(normalizedTheme);
      }
    }

    return normalizedTheme;
  }

  static clearManagedHighlights() {
    if (!this.supportsHighlights()) return;

    for (const type of this.KNOWN_TYPES) {
      globalThis.CSS.highlights.delete(this.getHighlightName(type));
    }
  }

  static enhanceElement(element) {
    if (!(element instanceof window.HTMLPreElement)) return null;

    if (!(element instanceof PixHighlighter)) {
      Object.setPrototypeOf(element, PixHighlighter.prototype);
    }

    element._ensureState();
    element._connect();
    return element;
  }

  static enhanceAll(root = document) {
    if (!root?.querySelectorAll) return [];

    const elements = [];
    if (root instanceof window.HTMLPreElement && root.matches?.("pre[is='pix-highlighter']")) {
      elements.push(root);
    }

    elements.push(...root.querySelectorAll("pre[is='pix-highlighter']"));
    return elements.map((element) => this.enhanceElement(element)).filter(Boolean);
  }

  static renderHighlights() {
    if (!this.supportsHighlights()) {
      this.clearManagedHighlights();
      return;
    }

    const groups = new Map();
    const counts = new Map();

    for (const type of this.KNOWN_TYPES) {
      groups.set(type, new Highlight());
      counts.set(type, 0);
    }

    for (const instance of this.instances) {
      if (!instance.isConnected || !instance._textNode) continue;

      for (const token of instance._tokens) {
        const highlight = groups.get(token.type);
        if (!highlight) continue;

        const range = document.createRange();
        range.setStart(instance._textNode, token.start);
        range.setEnd(instance._textNode, token.end);
        highlight.add(range);
        counts.set(token.type, counts.get(token.type) + 1);
      }
    }

    for (const type of this.KNOWN_TYPES) {
      const highlightName = this.getHighlightName(type);
      if (counts.get(type) > 0) {
        globalThis.CSS.highlights.set(highlightName, groups.get(type));
      } else {
        globalThis.CSS.highlights.delete(highlightName);
      }
    }
  }

  constructor() {
    super();
    this._ensureState();
  }

  connectedCallback() {
    this._connect();
  }

  _connect() {
    this._ensureState();
    if (this._isActive) return;

    this._isActive = true;
    this.dataset.pixHighlighterRoot = '';
    this.constructor.ensureComponentStyles();
    PixHighlighter.ensureThemeState();
    PixHighlighter.instances.add(this);
    this._ensureToolbar();
    this._syncThemeControl();
    this._updateHighlightState({ force: true });
    this._observe();
  }

  disconnectedCallback() {
    if (!this._stateReady || !this._isActive) return;

    this._isActive = false;
    this._teardownThemePicker();
    this._copyButton?.removeEventListener('click', this._onCopyClick);
    this._themeOptionButtons?.forEach((button) => {
      button.removeEventListener('click', this._onThemeOptionClick);
    });
    this._mo?.disconnect();
    this._mo = null;
    this._textNode = null;
    this._tokens = [];
    window.clearTimeout(this._copyResetTimer);
    this._copyResetTimer = 0;
    PixHighlighter.instances.delete(this);
    PixHighlighter.renderHighlights();
  }

  attributeChangedCallback(name, previousValue, nextValue) {
    this._ensureState();
    if ((name === 'data-lang' || name === 'lang') && previousValue !== nextValue) {
      this._updateHighlightState({ force: true });
    }
  }

  _getLanguage() {
    return normalizeLang(this.getAttribute('data-lang') || this.getAttribute('lang'));
  }

  _ensureState() {
    if (this._stateReady) {
      this._supportsHighlight = PixHighlighter.supportsHighlights();
      return;
    }

    this._stateReady = true;
    this._id ||= (++PixHighlighter._uid).toString(36);
    this[ENHANCED_MARKER] = true;
    this._isActive = false;
    this._lastText = null;
    this._lastLang = null;
    this._tokens = [];
    this._textNode = null;
    this._mo = null;
    this._copyButton = null;
    this._themePicker = null;
    this._themeTrigger = null;
    this._themeTriggerLabel = null;
    this._themeList = null;
    this._themeOptionButtons = [];
    this._copyResetTimer = 0;
    this._themeMenuListenerTimer = 0;
    this._isSyncingCode = false;
    this._supportsHighlight = PixHighlighter.supportsHighlights();
    this._supportsAnchorPositioning = supportsAnchorPositioning();
    this._onCopyClick = this._handleCopyClick.bind(this);
    this._onThemeOptionClick = this._handleThemeOptionClick.bind(this);
    this._onThemePickerToggle = this._handleThemePickerToggle.bind(this);
    this._onThemeMenuViewportChange = this._positionThemeList.bind(this);
    this._onThemeMenuClick = this._handleDocumentClick.bind(this);
    this._onThemeMenuKeyDown = this._handleDocumentKeyDown.bind(this);
  }

  _getCodeElement() {
    return this.querySelector('code');
  }

  _ensureToolbar() {
    const existingToolbar = this.querySelector('[data-pix-highlighter-toolbar]');

    if (existingToolbar) {
      this._themePicker = existingToolbar.querySelector('[data-pix-highlighter-theme-picker]');
      this._themeTrigger = existingToolbar.querySelector('[data-pix-highlighter-theme-trigger]');
      this._themeTriggerLabel = existingToolbar.querySelector('[data-pix-highlighter-theme-value]');
      this._themeList = existingToolbar.querySelector('[data-pix-highlighter-theme-list]');
      this._copyButton = existingToolbar.querySelector('button[data-pix-highlighter-copy]');
      this._themeOptionButtons = Array.from(
        existingToolbar.querySelectorAll('button[data-pix-highlighter-theme-option]')
      );
      this._teardownThemePicker();
      this._copyButton?.removeEventListener('click', this._onCopyClick);
      this._themeOptionButtons.forEach((button) => {
        button.removeEventListener('click', this._onThemeOptionClick);
      });
      this._copyButton?.addEventListener('click', this._onCopyClick);
      this._themeOptionButtons.forEach((button) => {
        button.addEventListener('click', this._onThemeOptionClick);
      });
      this._bindThemePicker();
      return;
    }

    const toolbar = document.createElement('span');
    toolbar.dataset.pixHighlighterToolbar = '';
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', 'Code block actions');

    const themePicker = document.createElement('details');
    themePicker.dataset.pixHighlighterThemePicker = '';

    const themeTrigger = document.createElement('summary');
    themeTrigger.dataset.pixHighlighterThemeTrigger = '';
    themeTrigger.setAttribute('aria-label', 'Syntax highlight theme');

    const triggerLabel = document.createElement('span');
    triggerLabel.dataset.pixHighlighterThemeValue = '';

    const triggerLeadingIcon = document.createElement('span');
    triggerLeadingIcon.dataset.pixHighlighterThemeIcon = '';
    triggerLeadingIcon.innerHTML = PALETTE_ICON;

    const triggerChevron = document.createElement('span');
    triggerChevron.dataset.pixHighlighterThemeChevron = '';
    triggerChevron.innerHTML = CHEVRON_ICON;

    themeTrigger.append(triggerLeadingIcon, triggerLabel, triggerChevron);

    const themeList = document.createElement('ul');
    themeList.dataset.pixHighlighterThemeList = '';
    themeList.id = `pix-highlighter-theme-list-${this._id}`;
    themeList.setAttribute('role', 'listbox');
    themeList.setAttribute('aria-label', 'Syntax highlight themes');
    themeTrigger.setAttribute('aria-haspopup', 'listbox');
    themeTrigger.setAttribute('aria-controls', themeList.id);
    themeTrigger.setAttribute('aria-expanded', 'false');

    const optionButtons = [];

    for (const option of PIX_HIGHLIGHTER_THEME_OPTIONS) {
      const optionItem = document.createElement('li');
      const optionButton = document.createElement('button');
      optionButton.type = 'button';
      optionButton.dataset.pixHighlighterThemeOption = option.value;
      optionButton.setAttribute('role', 'option');
      optionButton.innerHTML = `<span>${option.label}</span><span aria-hidden="true">${option.value}</span>`;
      optionItem.appendChild(optionButton);
      themeList.appendChild(optionItem);
      optionButtons.push(optionButton);
    }

    themePicker.append(themeTrigger, themeList);

    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.dataset.pixHighlighterCopy = '';
    this._setCopyButtonState('idle', copyButton);

    toolbar.append(themePicker, copyButton);
    this.prepend(toolbar);

    this._themePicker = themePicker;
    this._themeTrigger = themeTrigger;
    this._themeTriggerLabel = triggerLabel;
    this._themeList = themeList;
    this._themeOptionButtons = optionButtons;
    this._copyButton = copyButton;
    this._copyButton.addEventListener('click', this._onCopyClick);
    this._themeOptionButtons.forEach((button) => {
      button.addEventListener('click', this._onThemeOptionClick);
    });
    this._bindThemePicker();
  }

  _bindThemePicker() {
    if (!this._themePicker) {
      return;
    }

    this._configureThemeAnchor();

    this._themePicker.removeEventListener('toggle', this._onThemePickerToggle);
    this._themePicker.addEventListener('toggle', this._onThemePickerToggle);

    if (this._themeTrigger && this._themeList) {
      if (!this._themeList.id) {
        this._themeList.id = `pix-highlighter-theme-list-${this._id}`;
      }

      this._themeTrigger.setAttribute('aria-haspopup', 'listbox');
      this._themeTrigger.setAttribute('aria-controls', this._themeList.id);
      this._themeTrigger.setAttribute('aria-expanded', String(Boolean(this._themePicker.open)));
    }
  }

  _getThemeAnchorName() {
    return `--dout--pix-highlighter-theme-trigger-${this._id}`;
  }

  _configureThemeAnchor() {
    if (!this._themeTrigger || !this._themeList) {
      return;
    }

    const anchorName = this._getThemeAnchorName();

    this._themeTrigger.style.setProperty('anchor-name', anchorName);
    this._themeList.style.setProperty('position-anchor', anchorName);
    this._themeList.style.setProperty('--dout--pix-anchor-offset', `${THEME_MENU_OFFSET}px`);
  }

  _teardownThemePicker() {
    this._themePicker?.removeEventListener('toggle', this._onThemePickerToggle);
    window.clearTimeout(this._themeMenuListenerTimer);
    this._themeMenuListenerTimer = 0;
    this._removeFloatingThemePickerListeners();
    this._resetThemeListPosition();

    if (this._themeTrigger) {
      this._themeTrigger.setAttribute('aria-expanded', 'false');
    }
  }

  _addFloatingThemePickerListeners() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (!this._supportsAnchorPositioning) {
      window.addEventListener('resize', this._onThemeMenuViewportChange);
      document.addEventListener('scroll', this._onThemeMenuViewportChange, true);
    }

    document.addEventListener('click', this._onThemeMenuClick, true);
    document.addEventListener('keydown', this._onThemeMenuKeyDown, true);
  }

  _removeFloatingThemePickerListeners() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    window.removeEventListener('resize', this._onThemeMenuViewportChange);
    document.removeEventListener('scroll', this._onThemeMenuViewportChange, true);
    document.removeEventListener('click', this._onThemeMenuClick, true);
    document.removeEventListener('keydown', this._onThemeMenuKeyDown, true);
  }

  _resetThemeListPosition() {
    if (!this._themeList) {
      return;
    }

    this._themeList.style.removeProperty('top');
    this._themeList.style.removeProperty('left');
    this._themeList.style.removeProperty('min-width');
    this._themeList.style.removeProperty('max-height');
    this._themeList.style.removeProperty('visibility');
  }

  _handleThemePickerToggle() {
    const isOpen = Boolean(this._themePicker?.open);

    if (this._themeTrigger) {
      this._themeTrigger.setAttribute('aria-expanded', String(isOpen));
    }

    if (!isOpen) {
      window.clearTimeout(this._themeMenuListenerTimer);
      this._themeMenuListenerTimer = 0;
      this._removeFloatingThemePickerListeners();
      this._resetThemeListPosition();
      return;
    }

    window.clearTimeout(this._themeMenuListenerTimer);
    this._positionThemeList();
    this._themeMenuListenerTimer = window.setTimeout(() => {
      this._themeMenuListenerTimer = 0;
      if (this._themePicker?.open) {
        this._addFloatingThemePickerListeners();
      }
    }, 0);
  }

  _handleDocumentClick(event) {
    if (!this._themePicker?.open) {
      return;
    }

    const target = event.target;

    if (target instanceof Node && this._themePicker.contains(target)) {
      return;
    }

    this._themePicker.open = false;
  }

  _handleDocumentKeyDown(event) {
    if (event.key !== 'Escape' || !this._themePicker?.open) {
      return;
    }

    this._themePicker.open = false;
    this._themeTrigger?.focus();
  }

  _positionThemeList() {
    if (
      typeof window === 'undefined' ||
      !this._themePicker?.open ||
      !this._themeTrigger ||
      !this._themeList
    ) {
      return;
    }

    if (this._supportsAnchorPositioning) {
      this._resetThemeListPosition();
      return;
    }

    const triggerRect = this._themeTrigger.getBoundingClientRect();
    const minWidth = Math.max(triggerRect.width, 224);

    this._themeList.style.visibility = 'hidden';
    this._themeList.style.left = '0px';
    this._themeList.style.top = '0px';
    this._themeList.style.minWidth = `${Math.round(minWidth)}px`;
    this._themeList.style.maxHeight = `${Math.max(
      120,
      window.innerHeight - THEME_MENU_VIEWPORT_MARGIN * 2
    )}px`;

    const listRect = this._themeList.getBoundingClientRect();
    const listWidth = Math.min(
      Math.max(minWidth, listRect.width || minWidth),
      window.innerWidth - THEME_MENU_VIEWPORT_MARGIN * 2
    );
    const listHeight = listRect.height || 0;
    const availableBelow =
      window.innerHeight - triggerRect.bottom - THEME_MENU_VIEWPORT_MARGIN - THEME_MENU_OFFSET;
    const availableAbove = triggerRect.top - THEME_MENU_VIEWPORT_MARGIN - THEME_MENU_OFFSET;
    const openUpward =
      availableBelow < Math.min(listHeight, 240) && availableAbove > availableBelow;
    const maxHeight = Math.max(120, openUpward ? availableAbove : availableBelow);
    const renderedHeight = Math.min(listHeight || maxHeight, maxHeight);

    let left = triggerRect.left;
    if (left + listWidth > window.innerWidth - THEME_MENU_VIEWPORT_MARGIN) {
      left = window.innerWidth - THEME_MENU_VIEWPORT_MARGIN - listWidth;
    }
    left = Math.max(THEME_MENU_VIEWPORT_MARGIN, left);

    const top = openUpward
      ? Math.max(THEME_MENU_VIEWPORT_MARGIN, triggerRect.top - THEME_MENU_OFFSET - renderedHeight)
      : Math.max(
          THEME_MENU_VIEWPORT_MARGIN,
          Math.min(
            triggerRect.bottom + THEME_MENU_OFFSET,
            window.innerHeight - THEME_MENU_VIEWPORT_MARGIN - renderedHeight
          )
        );

    this._themeList.style.left = `${Math.round(left)}px`;
    this._themeList.style.top = `${Math.round(top)}px`;
    this._themeList.style.minWidth = `${Math.round(listWidth)}px`;
    this._themeList.style.maxHeight = `${Math.round(maxHeight)}px`;
    this._themeList.style.visibility = '';
  }

  _observe() {
    this._mo?.disconnect();
    this._mo = new MutationObserver((mutations) => {
      if (this._isSyncingCode) return;

      const languageChanged = mutations.some(
        (mutation) =>
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'data-lang' || mutation.attributeName === 'lang')
      );

      this._updateHighlightState({ force: languageChanged });
    });
    this._mo.observe(this, {
      attributes: true,
      attributeFilter: ['data-lang', 'lang'],
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  _updateHighlightState({ force = false } = {}) {
    const code = this._getCodeElement();
    if (!code) {
      this._tokens = [];
      this._textNode = null;
      PixHighlighter.renderHighlights();
      return;
    }

    const text = code.textContent ?? '';
    const language = this._getLanguage();

    if (!force && text === this._lastText && language === this._lastLang) {
      return;
    }

    this._lastText = text;
    this._lastLang = language;
    this._tokens = this._lex(language, text);

    if (this._supportsHighlight) {
      this._isSyncingCode = true;
      code.textContent = text;
      this._textNode = code.firstChild || code.appendChild(document.createTextNode(''));
      this._isSyncingCode = false;
    } else {
      this._textNode = null;
      this._renderFallbackMarkup(code, text, this._tokens);
    }

    PixHighlighter.renderHighlights();
  }

  _renderFallbackMarkup(code, text, tokens) {
    this._isSyncingCode = true;

    if (!tokens.length) {
      code.textContent = text;
      this._isSyncingCode = false;
      return;
    }

    const fragment = document.createDocumentFragment();
    let cursor = 0;

    for (const token of tokens) {
      if (token.start < cursor) continue;

      if (token.start > cursor) {
        fragment.append(document.createTextNode(text.slice(cursor, token.start)));
      }

      const tokenElement = document.createElement('span');
      tokenElement.className = `pix-token pix-token--${token.type}`;
      tokenElement.textContent = text.slice(token.start, token.end);
      fragment.append(tokenElement);
      cursor = token.end;
    }

    if (cursor < text.length) {
      fragment.append(document.createTextNode(text.slice(cursor)));
    }

    code.replaceChildren(fragment);
    this._isSyncingCode = false;
  }

  _syncThemeControl(theme = PixHighlighter.getCurrentTheme()) {
    if (this._themeTriggerLabel) {
      this._themeTriggerLabel.textContent = getThemeLabel(theme);
    }

    this._themeOptionButtons.forEach((button) => {
      const selected = button.dataset.pixHighlighterThemeOption === theme;
      button.toggleAttribute('data-selected', selected);
      button.setAttribute('aria-selected', String(selected));
    });
  }

  _handleThemeOptionClick(event) {
    const theme = event.currentTarget.dataset.pixHighlighterThemeOption;
    PixHighlighter.applyTheme(theme);
    if (this._themePicker) {
      this._themePicker.open = false;
    }
  }

  async _handleCopyClick() {
    const code = this._getCodeElement();

    if (!code?.textContent) return;

    try {
      await this._copyText(code.textContent);
      this._setCopyButtonState('copied');
    } catch {
      this._setCopyButtonState('error');
    }
  }

  async _copyText(value) {
    if (window.navigator?.clipboard?.writeText) {
      await window.navigator.clipboard.writeText(value);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand?.('copy');
    textarea.remove();

    if (!copied) {
      throw new Error('Copy command failed');
    }
  }

  _setCopyButtonState(state, button = this._copyButton) {
    if (!button) return;

    const stateConfig = {
      idle: { icon: COPY_ICON, label: 'Copy code' },
      copied: { icon: CHECK_ICON, label: 'Code copied' },
      error: { icon: ERROR_ICON, label: 'Copy failed' },
    };

    const config = stateConfig[state] || stateConfig.idle;
    button.dataset.copyState = state;
    setIconButtonContent(button, config.icon, config.label);

    if (button !== this._copyButton) return;

    window.clearTimeout(this._copyResetTimer);
    this._copyResetTimer = window.setTimeout(() => {
      this._setCopyButtonState('idle');
    }, COPY_RESET_DELAY);
  }

  _lex(lang, text) {
    const lexer = getLexer(lang);
    return lexer ? lexer(text) : [];
  }
}

function enhancePixHighlighters(root = document) {
  return PixHighlighter.enhanceAll(root);
}

function bootPixHighlighters() {
  if (typeof document === 'undefined') return;
  enhancePixHighlighters(document);
}

export {
  PIX_HIGHLIGHTER_THEME_OPTIONS,
  enhancePixHighlighters,
  lexBash,
  lexC,
  lexCPP,
  lexCSharp,
  lexCSS,
  lexGo,
  lexHTML,
  lexJS,
  lexJSON,
  lexMarkdown,
  lexPHP,
  lexPython,
  lexRust,
  lexTS,
  lexYAML,
  normalizeLang,
  PixHighlighter,
};
