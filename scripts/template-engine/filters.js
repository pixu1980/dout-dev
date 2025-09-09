// Template Engine - Built-in Filters
import { marked } from 'marked';
import { createMarkedOptions } from '../cms/marked-syntax.js';

// Small internal helpers (kept outside filters to keep per-filter complexity low)
function utilSlug(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureRootAbsolute(url) {
  if (url === undefined || url === null) return '';
  const s = String(url).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s; // absolute external
  if (s.startsWith('/')) return s; // already root-absolute
  if (s.startsWith('./')) return s.slice(1); // "./tags/x.html" -> "/tags/x.html"
  return `/${s.replace(/^\.?\/*/, '')}`; // "tags/x.html" -> "/tags/x.html"
}

function getTagHref(tag) {
  if (!tag) return '/tags/';
  if (typeof tag === 'object') {
    if (tag.url) return ensureRootAbsolute(tag.url);
    const keyOrName = tag.key || tag.name || tag.label || String(tag);
    return `/tags/${utilSlug(keyOrName)}.html`;
  }
  return `/tags/${utilSlug(tag)}.html`;
}

function getTagLabel(tag) {
  if (!tag) return '';
  return typeof tag === 'object' ? tag.label || tag.name || String(tag) : String(tag);
}

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
  renderer.registerFilter('slug', (value) => utilSlug(value));

  // Normalize URL to root-absolute when appropriate
  renderer.registerFilter('absUrl', (value) => ensureRootAbsolute(value));

  // HTML and security filters
  renderer.registerFilter('escapeHtml', (value) => {
    const htmlEscapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      // '/' not required in modern escaping map
    };
    return String(value).replace(/[&<>"']/g, (s) => htmlEscapeMap[s]);
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
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: filter intentionally supports many formats/locales
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
          day: 'numeric',
        });

      case 'long':
        return date.toLocaleDateString('it-IT', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

      case 'medium':
        return date.toLocaleDateString('it-IT', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

      case 'short':
        return date.toLocaleDateString('it-IT', {
          year: '2-digit',
          month: 'numeric',
          day: 'numeric',
        });

      case 'iso':
        return date.toISOString();

      case 'YYYY-MM-DD':
        return date.toISOString().split('T')[0];

      case 'DD MMM YYYY': {
        const months = [
          'Gen',
          'Feb',
          'Mar',
          'Apr',
          'Mag',
          'Giu',
          'Lug',
          'Ago',
          'Set',
          'Ott',
          'Nov',
          'Dic',
        ];
        const day = date.getDate().toString().padStart(2, '0');
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
      }

      case 'time':
        return date.toLocaleTimeString('it-IT');

      case 'datetime':
        return date.toLocaleString('it-IT');
      default: {
        // If it's not a predefined format, treat as locale
        const options = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        };

        // Try to use as locale, fallback to 'it-IT' if invalid
        try {
          return date.toLocaleDateString(format, options);
        } catch (_e) {
          console.warn(`Invalid locale "${format}", falling back to 'it-IT'`);
          return date.toLocaleDateString('it-IT', options);
        }
      }
    }
  });

  // String manipulation
  renderer.registerFilter('trim', (value) => String(value).trim());
  renderer.registerFilter('truncate', (value, length = 100) => {
    const str = String(value);
    return str.length > length ? `${str.substring(0, length)}...` : str;
  });

  // Array filters
  renderer.registerFilter('join', (value, separator = ', ') => {
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          // Handle tag objects {key, label}
          if (typeof item === 'object' && item.label) {
            return item.label;
          }
          return String(item);
        })
        .join(separator);
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

  // Serialize value as JSON string (useful for JSON-LD strings)
  renderer.registerFilter('json', (value) => {
    try {
      return JSON.stringify(value);
    } catch {
      return JSON.stringify(String(value));
    }
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
      currency: currency,
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

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: readable step-wise logic for UX strings
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

  // Additional missing filters
  renderer.registerFilter('slugify', (value) => {
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  });

  renderer.registerFilter('urlencode', (value) => {
    return encodeURIComponent(String(value));
  });

  // Derive tag href from tag object or string
  renderer.registerFilter('tagHref', (tag) => getTagHref(tag));

  // Derive tag label from tag object or string
  renderer.registerFilter('tagLabel', (tag) => getTagLabel(tag));

  renderer.registerFilter('slice', (value, start = 0, end = undefined) => {
    if (Array.isArray(value)) {
      return value.slice(start, end);
    }
    if (typeof value === 'string') {
      return value.slice(start, end);
    }
    return value;
  });

  renderer.registerFilter('markdown', (value) => {
    try {
      return marked(String(value), createMarkedOptions());
    } catch {
      return String(value);
    }
  });

  renderer.registerFilter('pad', (value, length = 2, char = '0') => {
    return String(value).padStart(length, char);
  });

  renderer.registerFilter('groupBy', (array, property) => {
    if (!Array.isArray(array)) return array;

    const groups = {};
    array.forEach((item) => {
      const key = item[property];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    return groups;
  });

  renderer.registerFilter('sortBy', (array, property, direction = 'asc') => {
    if (!Array.isArray(array)) return array;

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: comparator handles date and direction branches
    return [...array].sort((a, b) => {
      let valueA = a[property];
      let valueB = b[property];

      // Handle dates
      if (property === 'date') {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      }

      if (direction === 'desc') {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    });
  });

  // Handle property access (like post.next)
  renderer.registerFilter('', (value) => {
    // Empty filter - just return the value as-is
    return value;
  });
}
