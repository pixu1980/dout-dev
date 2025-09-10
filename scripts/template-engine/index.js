// Template Engine - Main Entry Point

import { registerBuiltinFilters } from './_filters.js';
import { TemplateRenderer } from './_renderer.js';

export class TemplateEngine {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();

    // Use DOM based renderer by default to handle nested structures reliably
    this.renderer = new TemplateRenderer(this.rootDir);

    // Register built-in filters
    registerBuiltinFilters(this.renderer);
  }

  /**
   * Render a template with given data
   * @param {string} templatePath - Path to template file
   * @param {object} data - Template data
   * @param {object} options - Render options
   * @returns {string} Rendered HTML
   */
  render(templatePath, data = {}, options = {}) {
    return this.renderer.render(templatePath, data, options);
  }

  /**
   * Register a custom filter
   * @param {string} name - Filter name
   * @param {function} fn - Filter function
   */
  registerFilter(name, fn) {
    this.renderer.registerFilter(name, fn);
  }
}

// Default export for convenience
export default TemplateEngine;

// Also export renderer classes for direct use in tests/tools
export { TemplateRenderer };
