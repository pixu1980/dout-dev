'use strict';

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

import { evaluateExpression, parseExpression } from './_expression-parser.js';
import { registerBuiltinFilters } from './_filters.js';

export class TemplateRenderer {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.filters = new Map();
    this.cache = new Map();

    // Register builtin filters immediately so both preprocessing and DOM rendering can use them
    registerBuiltinFilters(this);
  }

  registerFilter(name, fn) {
    this.filters.set(name, fn);
  }

  // --- String-based helpers for preprocessing (extends/includes) ---
  loadTemplate(filePath) {
    if (this.cache.has(filePath)) return this.cache.get(filePath);
    const content = readFileSync(filePath, 'utf8');
    this.cache.set(filePath, content);
    return content;
  }

  extractBlocks(content) {
    const blocks = {};
    const blockRegex = /<block\s+name=["']([^"']+)["'][^>]*>(.*?)<\/block>/gs;
    let match;
    while ((match = blockRegex.exec(content)) !== null) {
      blocks[match[1]] = match[2];
    }
    return blocks;
  }

  processExtends(content, _data, currentDir) {
    const extendsMatch = content.match(/<extends\s+src=["']([^"']+)["'][^>]*\/?>/);
    if (!extendsMatch) return content;

    const layoutPath = resolve(currentDir, extendsMatch[1]);
    const layoutContent = this.loadTemplate(layoutPath);
    const blocks = this.extractBlocks(content);

    let result = layoutContent;
    for (const [blockName, blockContent] of Object.entries(blocks)) {
      const blockRegex = new RegExp(`<block\\s+name=["']${blockName}["'][^>]*>.*?<\\/block>`, 'gs');
      result = result.replace(blockRegex, blockContent);
    }

    return result;
  }

  processIncludes(content, _data, currentDir) {
    const includeRegex =
      /<include\s+src=["']([^"']+)["']\s*\/?>|<include\s+src=["']([^"']+)["'][^>]*><\/include>/g;
    return content.replace(includeRegex, (m, s1, s2) => {
      if (/\s(?:data|locals)=['"]/.test(m)) {
        return m;
      }

      const src = s1 || s2;
      const includePath = resolve(currentDir, src);
      try {
        const includeContent = this.loadTemplate(includePath);
        return includeContent; // DOM renderer will handle inner directives
      } catch (err) {
        console.warn('Include failed:', err.message);
        return m;
      }
    });
  }

  // --- DOM rendering API ---
  render(templatePath, data = {}) {
    const fullPath = resolve(this.rootDir, templatePath);
    const currentDir = dirname(fullPath);
    const content = readFileSync(fullPath, 'utf8');

    // Preprocess extends/includes at string level
    let processed = content;
    try {
      processed = this.processExtends(processed, data, currentDir);
      processed = this.processIncludes(processed, data, currentDir);
    } catch (err) {
      console.warn('Preprocessing error:', err.message);
    }

    this._currentDir = currentDir;
    return this.renderString(processed, data);
  }

  renderString(templateString, data = {}, opts = {}) {
    // Allow passing a currentDir so renderString used directly (in tests) still supports relative <include>
    if (opts.currentDir) this._currentDir = opts.currentDir;
    const dom = new JSDOM(templateString);
    const document = dom.window.document;

    const hasHtml = /<html[\s>]/i.test(templateString);
    if (hasHtml) {
      this.processNode(document.documentElement, data);
      this.cleanup(document.documentElement);

      let out = dom.serialize();
      out = out.replace(/&lt;\//g, '&lt;&#x2F;');
      return out;
    }

    this.processNode(document.body, data);
    this.cleanup(document.body);
    let out = document.body.innerHTML;
    out = out.replace(/&lt;\//g, '&lt;&#x2F;');
    return out;
  }
  processNode(node, data) {
    if (!node) return;

    if (node.nodeType === node.TEXT_NODE) {
      const frag = this.processTextSegments(node, data);
      if (frag && node.parentNode) {
        node.parentNode.insertBefore(frag, node);
        node.remove();
      }
      return;
    }

    this.processAttributes(node, data);

    if (node.nodeType === node.ELEMENT_NODE) {
      if (this.handleElementDirectives(node, data)) return;
    }

    this.iterateChildren(node, data);
  }

  processAttributes(node, data) {
    if (!node.attributes) return;
    for (const attr of Array.from(node.attributes)) {
      attr.value = this.processText(attr.value, data);
    }
  }

  handleElementDirectives(node, data) {
    const tag = node.tagName?.toLowerCase();
    if (!tag) return false;
    if (tag === 'if') {
      this.processIfElement(node, data);
      return true;
    }
    if (tag === 'switch') {
      this.processSwitchElement(node, data);
      return true;
    }
    if (tag === 'md' || tag === 'markdown') {
      this.processMdElement(node, data);
      return true;
    }
    if (tag === 'include') {
      this.processIncludeElement(node, data);
      return true;
    }
    return false;
  }

  iterateChildren(node, data) {
    const children = Array.from(node.childNodes ?? []);
    for (const child of children) {
      if (child.nodeType === child.ELEMENT_NODE && child.tagName.toLowerCase() === 'for') {
        this.processForElement(child, data);
      } else {
        this.processNode(child, data);
      }
    }
  }

  processText(text, data) {
    return text.replace(/\{\{([^}]+)\}\}/g, (_m, expr) => {
      const parsed = parseExpression(expr);
      const value = evaluateExpression(parsed, data, Object.fromEntries(this.filters));
      if (value == null) return '';
      return String(value);
    });
  }

  processTextSegments(textNode, data) {
    const text = textNode.nodeType === textNode.TEXT_NODE ? textNode.textContent : String(textNode);
    const doc = textNode.ownerDocument;
    const frag = doc.createDocumentFragment();

    const regex = /\{\{([^}]+)\}\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before) frag.appendChild(doc.createTextNode(before));

      const expr = match[1];
      const parsed = parseExpression(expr);
      const value = evaluateExpression(parsed, data, Object.fromEntries(this.filters));

      if (value != null) {
        const appliedFilters = parsed.filters || [];
        const hasRawFilter = appliedFilters.some((f) => f.name === 'raw');
        if (hasRawFilter) {
          this.appendRawContentToFragment(String(value), frag);
        } else {
          frag.appendChild(doc.createTextNode(String(value)));
        }
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) frag.appendChild(doc.createTextNode(text.slice(lastIndex)));
    return frag;
  }

  appendRawContentToFragment(value, frag) {
    try {
      const tmp = new JSDOM(value).window.document.body;
      while (tmp.firstChild) frag.appendChild(tmp.firstChild);
    } catch {
      // fallback to text if parsing fails
      frag.appendChild(frag.ownerDocument.createTextNode(String(value)));
    }
  }

  escapeHtml(str) {
    const htmlEscapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
    };
    return String(str).replace(/[&<>"']/g, (s) => htmlEscapeMap[s]);
  }

  processForElement(forEl, data) {
    const each = forEl.getAttribute('each');
    const match = each?.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s+in\s+(.+)$/);
    if (!match) {
      forEl.remove();
      return;
    }

    const itemVar = match[1];
    const arrayExpr = match[2];

    const parsed = parseExpression(arrayExpr);
    const arr = evaluateExpression(parsed, data, Object.fromEntries(this.filters));
    if (!Array.isArray(arr)) {
      forEl.remove();
      return;
    }

    const parent = forEl.parentNode;
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      const clone = forEl.cloneNode(true);
      clone.removeAttribute('each');

      const newData = { ...data };
      newData[itemVar] = item;
      newData.loop = { index: i, first: i === 0, last: i === arr.length - 1, length: arr.length };

      const frag = forEl.ownerDocument.createDocumentFragment();
      while (clone.firstChild) frag.appendChild(clone.firstChild);

      this.processNode(frag, newData);
      parent.insertBefore(frag, forEl);
    }

    forEl.remove();
  }

  processIfElement(ifEl, data) {
    const cond = ifEl.getAttribute('condition') || '';
    const parsed = parseExpression(cond);
    const res = evaluateExpression(parsed, data, Object.fromEntries(this.filters));

    if (res) {
      const parent = ifEl.parentNode;
      const frag = ifEl.ownerDocument.createDocumentFragment();
      while (ifEl.firstChild) frag.appendChild(ifEl.firstChild);
      this.processNode(frag, data);
      parent.insertBefore(frag, ifEl);
      ifEl.remove();
    } else {
      ifEl.remove();
    }
  }

  processSwitchElement(switchEl, data) {
    const expr = switchEl.getAttribute('expr') || '';
    const parsed = parseExpression(expr);
    const val = evaluateExpression(parsed, data, Object.fromEntries(this.filters));

    let chosen = null;
    for (const child of Array.from(switchEl.children)) {
      if (child.tagName.toLowerCase() === 'case') {
        const caseVal = child.getAttribute('value');
        if (String(caseVal) === String(val)) {
          chosen = child;
          break;
        }
      }
    }

    if (!chosen)
      chosen = Array.from(switchEl.children).find((c) => c.tagName.toLowerCase() === 'default');

    if (chosen) {
      const parent = switchEl.parentNode;
      const frag = switchEl.ownerDocument.createDocumentFragment();
      while (chosen.firstChild) frag.appendChild(chosen.firstChild);
      this.processNode(frag, data);
      parent.insertBefore(frag, switchEl);
    }

    switchEl.remove();
  }

  processMdElement(mdEl, _data) {
    const inner = mdEl.innerHTML || '';
    const mdFilter = this.filters.get('md');
    const rendered = mdFilter ? mdFilter(inner) : inner;
    const parent = mdEl.parentNode;
    const frag = mdEl.ownerDocument.createDocumentFragment();
    const tmp = new JSDOM(rendered).window.document.body;
    while (tmp.firstChild) frag.appendChild(tmp.firstChild);
    parent.insertBefore(frag, mdEl);
    mdEl.remove();
  }

  processIncludeElement(includeEl, data) {
    const src = includeEl.getAttribute('src');
    if (!src) {
      includeEl.remove();
      return;
    }

    // Get locals or data attributes and merge with existing data
    let includeData = { ...data };

    const localsAttr = includeEl.getAttribute('locals');
    const dataAttr = includeEl.getAttribute('data');

    if (localsAttr) {
      try {
        // Process template expressions in the locals attribute first
        const processedLocals = this.processText(localsAttr, data);
        const locals = JSON.parse(processedLocals);
        includeData = { ...includeData, ...locals };
      } catch (err) {
        console.warn('Failed to parse locals attribute:', err.message, 'Raw:', localsAttr);
      }
    }

    if (dataAttr) {
      try {
        // Process template expressions in the data attribute first
        const processedData = this.processText(dataAttr, data);
        const dataObj = JSON.parse(processedData);
        includeData = { ...includeData, ...dataObj };
      } catch (err) {
        console.warn('Failed to parse data attribute:', err.message);
      }
    }

    const includePath = resolve(this._currentDir || this.rootDir, src);
    try {
      const content = readFileSync(includePath, 'utf8');
      const includedHtml = this.renderString(content, includeData);
      const tmp = new JSDOM(includedHtml).window.document.body;
      const frag = includeEl.ownerDocument.createDocumentFragment();
      while (tmp.firstChild) frag.appendChild(tmp.firstChild);
      includeEl.parentNode.insertBefore(frag, includeEl);
    } catch (err) {
      console.warn('Include failed:', err.message);
    }
    includeEl.remove();
  }

  cleanup(root) {
    const r = root || null;
    try {
      const container = r?.querySelectorAll ? r : null;
      if (!container) return;

      // Ensure main script is marked as module to satisfy bundlers (vite/rollup)
      const scripts = Array.from(container.querySelectorAll('script'));
      for (const s of scripts) {
        const src = s.getAttribute?.('src');
        if (src && typeof src === 'string' && src.trim().endsWith('/scripts/main.js')) {
          if (!s.hasAttribute('type')) s.setAttribute('type', 'module');
        }
      }

      // Normalize boolean attributes: keep them but remove empty values where possible
      for (const el of Array.from(container.querySelectorAll('[defer]'))) {
        if (el.getAttribute('defer') === '') el.setAttribute('defer', '');
      }
    } catch (_err) {
      // non-fatal - leave DOM as-is on error
    }
  }
}
