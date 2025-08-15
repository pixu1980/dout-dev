// Template Engine - Built-in Filters
import { marked } from 'marked';
import { createMarkedOptions } from '../cms/marked-syntax.js';

/**
 * Register all built-in filters
 * @param {TemplateRenderer} renderer
 */
export function registerBuiltinFilters(renderer) {
  // Text transformation filters
  renderer.registerFilter('upper', (value) => String(value).toUpperCase());
  renderer.registerFilter('lower', (value) => String(value).toLowerCase());
  renderer.registerFilter('capitalize', (value) => {
    const str = String(value);
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  });

  // URL and slug filters
  renderer.registerFilter('slug', (value) => {
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  });

  // HTML and security filters
  renderer.registerFilter('escapeHtml', (value) => {
    const htmlEscapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return String(value).replace(/[&<>"'/]/g, (s) => htmlEscapeMap[s]);
  });

  renderer.registerFilter('raw', (value) => value); // No escaping

  // Strip HTML tags
  renderer.registerFilter('striptags', (value) => {
    return String(value).replace(/<[^>]*>/g, '');
  });

  // Markdown filter
  // Markdown filter: returns HTML but template engine inserts result
  // as text (escaping it) in normal interpolations. Existing tests
  // verify presence of code (might be escaped). To maintain
  // compatibility, if output contains <pre is="pix-highlighter"> we leave it as-is;
  // otherwise fallback to raw string.
  renderer.registerFilter('md', (value) => {
    try {
      return marked(String(value), createMarkedOptions());
    } catch {
      return String(value);
    }
  });
  // Non-escaped variant to use with | raw filter if needed
  renderer.registerFilter('rawMd', (value) => {
    try {
      return marked(String(value), createMarkedOptions());
    } catch {
      return String(value);
    }
  });

  // Date formatting filter
  renderer.registerFilter('date', (value, format = 'it-IT') => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    // Handle strftime-like format strings
    if (format.includes('%')) {
      const options = {};
      if (format.includes('%d')) options.day = 'numeric';
      if (format.includes('%B')) options.month = 'long';
      if (format.includes('%Y')) options.year = 'numeric';
      return date.toLocaleDateString('it-IT', options);
    }

    // Handle predefined formats
    switch (format) {
      case 'full':
        return date.toLocaleDateString('it-IT', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

      case 'long':
        return date.toLocaleDateString('it-IT', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

      case 'medium':
        return date.toLocaleDateString('it-IT', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

      case 'short':
        return date.toLocaleDateString('it-IT', {
          year: '2-digit',
          month: 'numeric',
          day: 'numeric'
        });

      case 'iso':
        return date.toISOString();

      case 'YYYY-MM-DD':
        return date.toISOString().split('T')[0];

      case 'DD MMM YYYY': {
        const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
                       'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
        const day = date.getDate().toString().padStart(2, '0');
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
      }

      case 'time':
        return date.toLocaleTimeString('it-IT');

      case 'datetime':
        return date.toLocaleString('it-IT');      default: {
        // If it's not a predefined format, treat as locale
        const options = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        };

        return date.toLocaleDateString(format, options);
      }
    }
  });

  // String manipulation
  renderer.registerFilter('trim', (value) => String(value).trim());
  renderer.registerFilter('truncate', (value, length = 100) => {
    const str = String(value);
    return str.length > length ? str.substring(0, length) + '...' : str;
  });

  // Array filters
  renderer.registerFilter('join', (value, separator = ', ') => {
    if (Array.isArray(value)) {
      return value.map(item => {
        // Handle tag objects {key, label}
        if (typeof item === 'object' && item.label) {
          return item.label;
        }
        return String(item);
      }).join(separator);
    }
    return value;
  });

  renderer.registerFilter('length', (value) => {
    if (Array.isArray(value) || typeof value === 'string') {
      return value.length;
    }
    return 0;
  });

  // Utility filters
  renderer.registerFilter('default', (value, defaultValue = '') => {
    return value !== undefined && value !== null && value !== '' ? value : defaultValue;
  });

  // Additional filters for comprehensive testing
  renderer.registerFilter('number', (value, decimals = 0) => {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toFixed(decimals);
  });

  renderer.registerFilter('currency', (value, currency = 'EUR') => {
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency
    }).format(num);
  });

  renderer.registerFilter('first', (value) => {
    if (Array.isArray(value) && value.length > 0) {
      return value[0];
    }
    return value;
  });

  renderer.registerFilter('last', (value) => {
    if (Array.isArray(value) && value.length > 0) {
      return value[value.length - 1];
    }
    return value;
  });

  renderer.registerFilter('prop', (value, propertyName) => {
    if (typeof value === 'object' && value !== null) {
      return value[propertyName];
    }
    return value;
  });

  renderer.registerFilter('timeAgo', (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'proprio ora';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minuto' : 'minuti'} fa`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'ora' : 'ore'} fa`;
    if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'giorno' : 'giorni'} fa`;

    return date.toLocaleDateString('it-IT');
  });
}
