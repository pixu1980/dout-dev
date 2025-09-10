/**
 * PostFeedLayoutSelector - Custom Element for switching post card layout modes.
 */

import {
  DEFAULT_LAYOUT,
  LAYOUTS,
  applyPostFeedLayout,
  getCurrentPostFeedLayout,
  initPostFeedLayout,
} from '../../post-feed-layout.js';
import cssText from 'bundle-text:./PostFeedLayoutSelector.css';

const ELEMENT_NAME = 'post-feed-layout-selector';
const OPTIONS = [
  {
    icon: '<path d="M5 6.5h14M5 12h14M5 17.5h14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" />',
    id: 'list',
    label: 'List',
  },
  {
    icon: '<rect x="4.5" y="4.5" width="6" height="6" rx="1" /><rect x="13.5" y="4.5" width="6" height="6" rx="1" /><rect x="4.5" y="13.5" width="6" height="6" rx="1" /><rect x="13.5" y="13.5" width="6" height="6" rx="1" />',
    id: 'grid',
    label: 'Grid',
  },
];

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

function renderButtons(currentLayout) {
  return OPTIONS.map((option) => {
    const pressed = option.id === currentLayout;
    return `
      <button
        type="button"
        class="post-feed-layout__button"
        data-layout="${option.id}"
        aria-pressed="${pressed}"
        aria-label="${option.label} layout"
        title="${option.label} layout"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">${option.icon}</svg>
        <span>${option.label}</span>
      </button>
    `;
  }).join('');
}

class PostFeedLayoutSelector extends HTMLElement {
  static ensureComponentStyles() {
    return adoptComponentStyles();
  }

  static {
    this.ensureComponentStyles();
    globalThis.customElements &&
      !globalThis.customElements.get(ELEMENT_NAME) &&
      globalThis.customElements.define(ELEMENT_NAME, this);
  }

  constructor() {
    super();
    this._onClick = this._onClick.bind(this);
    this._onLayoutChange = this._onLayoutChange.bind(this);
  }

  connectedCallback() {
    this.constructor.ensureComponentStyles();
    initPostFeedLayout();
    this.render();
    this._buttons = Array.from(this.querySelectorAll('.post-feed-layout__button'));
    this._buttons.forEach((button) => {
      button.addEventListener('click', this._onClick);
    });
    document.addEventListener('post-feed-layout-changed', this._onLayoutChange);
  }

  disconnectedCallback() {
    this._buttons?.forEach((button) => {
      button.removeEventListener('click', this._onClick);
    });
    document.removeEventListener('post-feed-layout-changed', this._onLayoutChange);
  }

  render() {
    const currentLayout = LAYOUTS.includes(getCurrentPostFeedLayout())
      ? getCurrentPostFeedLayout()
      : DEFAULT_LAYOUT;
    const template = document.createElement('template');

    this.textContent = '';
    template.innerHTML = `
      <div class="post-feed-layout" role="toolbar" aria-label="Post card layout">
        <span class="post-feed-layout__label">View</span>
        <div class="post-feed-layout__group" role="group" aria-label="Post feed layout options">
          ${renderButtons(currentLayout)}
        </div>
      </div>
    `;

    this.appendChild(template.content.cloneNode(true));
  }

  syncButtons(layout) {
    this.querySelectorAll('.post-feed-layout__button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.layout === layout));
    });
  }

  _onClick(event) {
    const layout = event.currentTarget.dataset.layout;
    applyPostFeedLayout(layout);
  }

  _onLayoutChange(event) {
    this.syncButtons(event.detail?.layout || DEFAULT_LAYOUT);
  }
}

export { DEFAULT_LAYOUT, LAYOUTS, OPTIONS, PostFeedLayoutSelector };

export default PostFeedLayoutSelector;
