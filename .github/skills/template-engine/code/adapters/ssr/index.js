import { JSDOM } from 'jsdom';

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

function createSsrDocument(html) {
  const dom = new JSDOM(html);
  return {
    document: dom.window.document,
    serialize: () => dom.serialize(),
  };
}

export class SsrTemplateRenderer extends PortableTemplateRenderer {
  constructor(options = {}) {
    const templates = options.templates || {};

    super({
      ...options,
      rootDir: options.rootDir || '/',
      environment: 'ssr',
      loadTemplate: options.loadTemplate || createRegistryLoader(templates),
      resolveTemplate: options.resolveTemplate || resolveVirtualPath,
      dirnamePath: options.dirnamePath || dirnameVirtualPath,
      createDocument: options.createDocument || createSsrDocument,
      serializeDocument:
        options.serializeDocument ||
        ((domHandle, context) =>
          context.hasHtml ? domHandle.serialize() : context.document.body.innerHTML),
    });
  }
}

export class SsrTemplateEngine {
  constructor(options = {}) {
    this.rootDir = options.rootDir || '/';
    this.renderer =
      options.renderer ||
      new SsrTemplateRenderer({
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

export function createSsrTemplateEngine(options = {}) {
  return new SsrTemplateEngine(options);
}

export { SsrTemplateEngine as TemplateEngine, SsrTemplateRenderer as TemplateRenderer };
export default SsrTemplateEngine;
