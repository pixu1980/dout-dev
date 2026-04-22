import { evaluateExpression, parseExpression } from '../expression';
import { registerBuiltinFilters } from '../filters/builtin-filters.js';

function defaultResolveTemplate(currentDir, sourcePath) {
  if (!sourcePath) return currentDir;
  if (sourcePath.startsWith('/')) return sourcePath;
  return `${currentDir.replace(/\/$/, '')}/${sourcePath}`;
}

function defaultDirnamePath(filePath) {
  if (!filePath || filePath === '/') return '/';
  const parts = filePath.split('/');
  parts.pop();
  return parts.join('/') || '/';
}

function defaultSerializeDocument(domHandle, context) {
  if (context.hasHtml && typeof domHandle.serialize === 'function') {
    return domHandle.serialize();
  }
  return context.document.body ? context.document.body.innerHTML : '';
}

export class PortableTemplateRenderer {
  constructor(options = {}) {
    if (typeof options.createDocument !== 'function') {
      throw new Error('PortableTemplateRenderer requires a createDocument adapter');
    }

    this.rootDir = options.rootDir || '/';
    this.environment = options.environment || 'runtime';
    this.filters = new Map();
    this.cache = new Map();
    this.loadTemplateContent =
      options.loadTemplate ||
      (() => {
        throw new Error('No template loader configured for this renderer');
      });
    this.resolveTemplate = options.resolveTemplate || defaultResolveTemplate;
    this.dirnamePath = options.dirnamePath || defaultDirnamePath;
    this.createDocument = options.createDocument;
    this.serializeDocument = options.serializeDocument || defaultSerializeDocument;
    this.markdownOptions = options.markdownOptions || {};
    this._currentDir = options.currentDir || this.rootDir;

    if (options.registerBuiltinFilters !== false) {
      registerBuiltinFilters(this, { markdown: this.markdownOptions });
    }
  }

  registerFilter(name, fn) {
    this.filters.set(name, fn);
  }

  getFilterObject() {
    return Object.fromEntries(this.filters);
  }

  readTemplate(resolvedPath) {
    if (this.cache.has(resolvedPath)) {
      return this.cache.get(resolvedPath);
    }

    const content = this.loadTemplateContent(resolvedPath);
    this.cache.set(resolvedPath, content);
    return content;
  }

  extractBlocks(content) {
    const blocks = {};
    const blockPattern = /<block\s+name=["']([^"']+)["'][^>]*>(.*?)<\/block>/gs;
    let match;

    while ((match = blockPattern.exec(content)) !== null) {
      blocks[match[1]] = match[2];
    }

    return blocks;
  }

  processExtends(content, _data, currentDir) {
    const extendsMatch = content.match(/<extends\s+src=["']([^"']+)["'][^>]*\/?>/);
    if (!extendsMatch) {
      return content;
    }

    const layoutPath = this.resolveTemplate(currentDir, extendsMatch[1]);
    const layoutContent = this.readTemplate(layoutPath);
    const blocks = this.extractBlocks(content);

    let result = layoutContent;
    for (const [blockName, blockContent] of Object.entries(blocks)) {
      const blockPattern = new RegExp(
        `<block\\s+name=["']${blockName}["'][^>]*>.*?<\\/block>`,
        'gs'
      );
      result = result.replace(blockPattern, blockContent);
    }

    return result;
  }

  processIncludes(content, _data, currentDir) {
    const includePattern =
      /<include\s+src=["']([^"']+)["']\s*\/?>|<include\s+src=["']([^"']+)["'][^>]*><\/include>/g;

    return content.replace(includePattern, (match, srcA, srcB) => {
      if (/\s(?:data|locals)=["']/.test(match)) {
        return match;
      }

      const sourcePath = srcA || srcB;
      const includePath = this.resolveTemplate(currentDir, sourcePath);

      try {
        return this.readTemplate(includePath);
      } catch (error) {
        console.warn('Include failed:', error.message);
        return match;
      }
    });
  }

  preprocessTemplate(content, data, currentDir) {
    let processed = content;
    processed = this.processExtends(processed, data, currentDir);
    processed = this.processIncludes(processed, data, currentDir);
    return processed;
  }

  render(templatePath, data = {}, options = {}) {
    const resolvedPath = this.resolveTemplate(this.rootDir, templatePath);
    const currentDir = options.currentDir || this.dirnamePath(resolvedPath);
    const content = this.readTemplate(resolvedPath);

    let processed = content;
    try {
      processed = this.preprocessTemplate(content, data, currentDir);
    } catch (error) {
      console.warn('Preprocessing error:', error.message);
    }

    return this.renderString(processed, data, {
      ...options,
      currentDir,
      preprocessed: true,
    });
  }

  renderString(templateString, data = {}, options = {}) {
    const currentDir = options.currentDir || this._currentDir || this.rootDir;
    this._currentDir = currentDir;

    let processedTemplate = templateString;
    if (!options.preprocessed && currentDir) {
      try {
        processedTemplate = this.preprocessTemplate(templateString, data, currentDir);
      } catch (error) {
        console.warn('Preprocessing error:', error.message);
      }
    }

    const domHandle = this.createDocument(processedTemplate);
    const { document } = domHandle;
    const hasHtml = /<html[\s>]/i.test(processedTemplate);

    if (hasHtml) {
      this.processNode(document.documentElement, data);
      this.cleanup(document.documentElement);
      return this.normalizeOutput(
        this.serializeDocument(domHandle, {
          hasHtml: true,
          document,
        })
      );
    }

    this.processNode(document.body, data);
    this.cleanup(document.body);
    return this.normalizeOutput(
      this.serializeDocument(domHandle, {
        hasHtml: false,
        document,
      })
    );
  }

  normalizeOutput(output) {
    return String(output).replace(/&lt;\//g, '&lt;&#x2F;');
  }

  processNode(node, data) {
    if (!node) return;

    if (node.nodeType === node.TEXT_NODE) {
      const fragment = this.processTextSegments(node, data);
      if (fragment && node.parentNode) {
        node.parentNode.insertBefore(fragment, node);
        node.remove();
      }
      return;
    }

    this.processAttributes(node, data);

    if (node.nodeType === node.ELEMENT_NODE && this.handleElementDirectives(node, data)) {
      return;
    }

    this.iterateChildren(node, data);
  }

  processAttributes(node, data) {
    if (!node.attributes) return;

    for (const attribute of Array.from(node.attributes)) {
      attribute.value = this.processText(attribute.value, data);
    }
  }

  handleElementDirectives(node, data) {
    const tagName = node.tagName?.toLowerCase();
    if (!tagName) return false;

    if (tagName === 'if') {
      this.processIfElement(node, data);
      return true;
    }

    if (tagName === 'switch') {
      this.processSwitchElement(node, data);
      return true;
    }

    if (tagName === 'md' || tagName === 'markdown') {
      this.processMdElement(node, data);
      return true;
    }

    if (tagName === 'include') {
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
    return String(text).replace(/\{\{([^}]+)\}\}/g, (_match, expressionString) => {
      const parsed = parseExpression(expressionString);
      const value = evaluateExpression(parsed, data, this.getFilterObject());
      return value == null ? '' : String(value);
    });
  }

  processTextSegments(textNode, data) {
    const text = textNode.nodeType === textNode.TEXT_NODE ? textNode.textContent : String(textNode);
    const document = textNode.ownerDocument;
    const fragment = document.createDocumentFragment();
    const pattern = /\{\{([^}]+)\}\}/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index);
      if (before) {
        fragment.appendChild(document.createTextNode(before));
      }

      const parsed = parseExpression(match[1]);
      const value = evaluateExpression(parsed, data, this.getFilterObject());

      if (value != null) {
        const hasRawFilter = (parsed.filters || []).some((filter) => filter.name === 'raw');
        if (hasRawFilter) {
          this.appendHtmlToFragment(String(value), fragment);
        } else {
          fragment.appendChild(document.createTextNode(String(value)));
        }
      }

      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    return fragment;
  }

  appendHtmlToFragment(html, fragment) {
    const ownerDocument = fragment.ownerDocument;
    const parsed = this.createDocument(html);
    const sourceRoot = parsed.document.body || parsed.document.documentElement;

    for (const child of Array.from(sourceRoot.childNodes)) {
      const imported = ownerDocument.importNode
        ? ownerDocument.importNode(child, true)
        : child.cloneNode(true);
      fragment.appendChild(imported);
    }
  }

  processForElement(forElement, data) {
    const each = forElement.getAttribute('each');
    const match = each?.match(/^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s+in\s+(.+)$/);
    if (!match) {
      forElement.remove();
      return;
    }

    const itemVariable = match[1];
    const arrayExpression = match[2];
    const parsed = parseExpression(arrayExpression);
    const arrayValue = evaluateExpression(parsed, data, this.getFilterObject());

    if (!Array.isArray(arrayValue)) {
      forElement.remove();
      return;
    }

    const parent = forElement.parentNode;
    for (let index = 0; index < arrayValue.length; index += 1) {
      const item = arrayValue[index];
      const clone = forElement.cloneNode(true);
      clone.removeAttribute('each');

      const nextData = {
        ...data,
        [itemVariable]: item,
        loop: {
          index,
          first: index === 0,
          last: index === arrayValue.length - 1,
          length: arrayValue.length,
        },
      };

      const fragment = forElement.ownerDocument.createDocumentFragment();
      while (clone.firstChild) {
        fragment.appendChild(clone.firstChild);
      }

      this.processNode(fragment, nextData);
      parent.insertBefore(fragment, forElement);
    }

    forElement.remove();
  }

  processIfElement(ifElement, data) {
    const condition = ifElement.getAttribute('condition') || '';
    const parsed = parseExpression(condition);
    const result = evaluateExpression(parsed, data, this.getFilterObject());

    if (result) {
      const fragment = ifElement.ownerDocument.createDocumentFragment();
      while (ifElement.firstChild) {
        fragment.appendChild(ifElement.firstChild);
      }
      this.processNode(fragment, data);
      ifElement.parentNode.insertBefore(fragment, ifElement);
    }

    ifElement.remove();
  }

  processSwitchElement(switchElement, data) {
    const expression = switchElement.getAttribute('expr') || '';
    const parsed = parseExpression(expression);
    const value = evaluateExpression(parsed, data, this.getFilterObject());

    let chosen = null;
    for (const child of Array.from(switchElement.children)) {
      if (
        child.tagName.toLowerCase() === 'case' &&
        String(child.getAttribute('value')) === String(value)
      ) {
        chosen = child;
        break;
      }
    }

    if (!chosen) {
      chosen = Array.from(switchElement.children).find(
        (child) => child.tagName.toLowerCase() === 'default'
      );
    }

    if (chosen) {
      const fragment = switchElement.ownerDocument.createDocumentFragment();
      while (chosen.firstChild) {
        fragment.appendChild(chosen.firstChild);
      }
      this.processNode(fragment, data);
      switchElement.parentNode.insertBefore(fragment, switchElement);
    }

    switchElement.remove();
  }

  processMdElement(markdownElement, _data) {
    const inner = markdownElement.innerHTML || '';
    const markdownFilter = this.filters.get('md');
    const rendered = markdownFilter ? markdownFilter(inner) : inner;
    const fragment = markdownElement.ownerDocument.createDocumentFragment();
    this.appendHtmlToFragment(rendered, fragment);
    markdownElement.parentNode.insertBefore(fragment, markdownElement);
    markdownElement.remove();
  }

  processIncludeElement(includeElement, data) {
    const sourcePath = includeElement.getAttribute('src');
    if (!sourcePath) {
      includeElement.remove();
      return;
    }

    let includeData = { ...data };
    const localsAttribute = includeElement.getAttribute('locals');
    const dataAttribute = includeElement.getAttribute('data');

    if (localsAttribute) {
      try {
        const processedLocals = this.processText(localsAttribute, data);
        includeData = { ...includeData, ...JSON.parse(processedLocals) };
      } catch (error) {
        console.warn('Failed to parse locals attribute:', error.message, 'Raw:', localsAttribute);
      }
    }

    if (dataAttribute) {
      try {
        const processedData = this.processText(dataAttribute, data);
        includeData = { ...includeData, ...JSON.parse(processedData) };
      } catch (error) {
        console.warn('Failed to parse data attribute:', error.message);
      }
    }

    const includePath = this.resolveTemplate(this._currentDir || this.rootDir, sourcePath);
    const includeDir = this.dirnamePath(includePath);

    try {
      const content = this.readTemplate(includePath);
      const processed = this.preprocessTemplate(content, includeData, includeDir);
      const rendered = this.renderString(processed, includeData, {
        currentDir: includeDir,
        preprocessed: true,
      });
      const fragment = includeElement.ownerDocument.createDocumentFragment();
      this.appendHtmlToFragment(rendered, fragment);
      includeElement.parentNode.insertBefore(fragment, includeElement);
    } catch (error) {
      console.warn('Include failed:', error.message);
    }

    includeElement.remove();
  }

  cleanup(root) {
    try {
      const container = root?.querySelectorAll ? root : null;
      if (!container) return;

      const scripts = Array.from(container.querySelectorAll('script'));
      for (const script of scripts) {
        const sourcePath = script.getAttribute?.('src');
        if (
          sourcePath &&
          sourcePath.trim().endsWith('/scripts/main.js') &&
          !script.hasAttribute('type')
        ) {
          script.setAttribute('type', 'module');
        }
      }

      for (const element of Array.from(container.querySelectorAll('[defer]'))) {
        if (element.getAttribute('defer') === '') {
          element.setAttribute('defer', '');
        }
      }
    } catch (_error) {
      // Leave the DOM untouched on non-fatal cleanup errors.
    }
  }
}
