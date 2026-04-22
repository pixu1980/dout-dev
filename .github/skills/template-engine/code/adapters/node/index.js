import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { JSDOM } from 'jsdom';

import { PortableTemplateRenderer } from '../../core/render/template-renderer.js';

function createNodeDocument(html) {
  const dom = new JSDOM(html);
  return {
    document: dom.window.document,
    serialize: () => dom.serialize(),
  };
}

function normalizeRendererOptions(rootDirOrOptions, maybeOptions = {}) {
  if (typeof rootDirOrOptions === 'string') {
    return {
      ...maybeOptions,
      rootDir: rootDirOrOptions,
    };
  }

  return {
    ...rootDirOrOptions,
  };
}

export class NodeTemplateRenderer extends PortableTemplateRenderer {
  constructor(rootDirOrOptions = {}, maybeOptions = {}) {
    const options = normalizeRendererOptions(rootDirOrOptions, maybeOptions);
    const rootDir = options.rootDir || process.cwd();

    super({
      ...options,
      rootDir,
      environment: 'node',
      loadTemplate: options.loadTemplate || ((filePath) => readFileSync(filePath, 'utf8')),
      resolveTemplate:
        options.resolveTemplate || ((currentDir, sourcePath) => resolve(currentDir, sourcePath)),
      dirnamePath: options.dirnamePath || ((filePath) => dirname(filePath)),
      createDocument: options.createDocument || createNodeDocument,
      serializeDocument:
        options.serializeDocument ||
        ((domHandle, context) =>
          context.hasHtml ? domHandle.serialize() : context.document.body.innerHTML),
    });
  }
}

export class NodeTemplateEngine {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.renderer =
      options.renderer ||
      new NodeTemplateRenderer({
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

export { NodeTemplateEngine as TemplateEngine, NodeTemplateRenderer as TemplateRenderer };
export default NodeTemplateEngine;
