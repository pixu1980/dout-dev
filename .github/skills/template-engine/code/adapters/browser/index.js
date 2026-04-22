import { PortableTemplateRenderer } from '../../core/render/template-renderer.js';
import { dirnameVirtualPath, resolveVirtualPath } from '../../shared/virtual-path.js';

function createRegistryLoader(templates = {}) {
  return (templatePath) => {
    if (templatePath in templates) {
      return templates[templatePath];
    }
    throw new Error(`Template not found: ${templatePath}`);
  };
}

function createBrowserDocument(html) {
  if (typeof DOMParser !== 'function' || typeof XMLSerializer !== 'function') {
    throw new Error('BrowserTemplateRenderer requires DOMParser and XMLSerializer');
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, 'text/html');
  return {
    document,
    serialize: () => new XMLSerializer().serializeToString(document),
  };
}

export class BrowserTemplateRenderer extends PortableTemplateRenderer {
  constructor(options = {}) {
    const templates = options.templates || {};

    super({
      ...options,
      rootDir: options.rootDir || '/',
      environment: 'browser',
      loadTemplate: options.loadTemplate || createRegistryLoader(templates),
      resolveTemplate: options.resolveTemplate || resolveVirtualPath,
      dirnamePath: options.dirnamePath || dirnameVirtualPath,
      createDocument: options.createDocument || createBrowserDocument,
      serializeDocument:
        options.serializeDocument ||
        ((domHandle, context) =>
          context.hasHtml ? domHandle.serialize() : context.document.body.innerHTML),
    });
  }
}

export class BrowserTemplateEngine {
  constructor(options = {}) {
    this.rootDir = options.rootDir || '/';
    this.renderer =
      options.renderer ||
      new BrowserTemplateRenderer({
        ...options,
        rootDir: this.rootDir,
      });
  }

  render(templatePath, data = {}, options = {}) {
    return this.renderer.render(templatePath, data, options);
  }

  renderString(templateString, data = {}, options = {}) {
    return this.renderer.renderString(templateString, data, options);
  }

  registerFilter(name, fn) {
    this.renderer.registerFilter(name, fn);
  }
}

export function createBrowserTemplateEngine(options = {}) {
  return new BrowserTemplateEngine(options);
}

export { BrowserTemplateEngine as TemplateEngine, BrowserTemplateRenderer as TemplateRenderer };
export default BrowserTemplateEngine;
