import { marked } from 'marked';

import { createPortableMarkedOptions } from '../../shared/portable-marked-options.js';

function utilSlug(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureRootAbsolute(url) {
  if (url === undefined || url === null) return '';

  const value = String(url).trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return value;
  if (value.startsWith('./')) return value.slice(1);
  return `/${value.replace(/^\.?\/*/, '')}`;
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

const TAG_UPPERCASE_MAP = new Map([
  ['css', 'CSS'],
  ['html', 'HTML'],
]);

function applyTagDisplayCase(label) {
  const key = String(label).toLowerCase().trim();
  return TAG_UPPERCASE_MAP.get(key) || label;
}

function getTagLabel(tag) {
  if (!tag) return '';
  const raw = typeof tag === 'object' ? tag.label || tag.name || String(tag) : String(tag);
  return applyTagDisplayCase(raw);
}

export function registerBuiltinFilters(renderer, options = {}) {
  const markedOptions = createPortableMarkedOptions(options.markdown || {});

  renderer.registerFilter('upper', (value) => String(value).toUpperCase());
  renderer.registerFilter('lower', (value) => String(value).toLowerCase());
  renderer.registerFilter('capitalize', (value) => {
    const stringValue = String(value);
    return stringValue.charAt(0).toUpperCase() + stringValue.slice(1).toLowerCase();
  });

  renderer.registerFilter('slug', (value) => utilSlug(value));
  renderer.registerFilter('absUrl', (value) => ensureRootAbsolute(value));

  renderer.registerFilter('escapeHtml', (value) => {
    const htmlEscapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
    };
    return String(value).replace(/[&<>"']/g, (character) => htmlEscapeMap[character]);
  });

  renderer.registerFilter('raw', (value) => value);
  renderer.registerFilter('striptags', (value) => String(value).replace(/<[^>]*>/g, ''));

  renderer.registerFilter('md', (value) => {
    try {
      return marked(String(value), markedOptions);
    } catch {
      return String(value);
    }
  });

  renderer.registerFilter('rawMd', (value) => {
    try {
      return marked(String(value), markedOptions);
    } catch {
      return String(value);
    }
  });

  renderer.registerFilter('date', (value, format = 'it-IT') => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    if (format.includes('%')) {
      const localeOptions = {};
      if (format.includes('%d')) localeOptions.day = 'numeric';
      if (format.includes('%B')) localeOptions.month = 'long';
      if (format.includes('%Y')) localeOptions.year = 'numeric';
      return date.toLocaleDateString('it-IT', localeOptions);
    }

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
      default:
        try {
          return date.toLocaleDateString(format, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        } catch (_error) {
          console.warn(`Invalid locale "${format}", falling back to 'it-IT'`);
          return date.toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        }
    }
  });

  renderer.registerFilter('trim', (value) => String(value).trim());
  renderer.registerFilter('truncate', (value, length = 100) => {
    const stringValue = String(value);
    return stringValue.length > length ? `${stringValue.substring(0, length)}...` : stringValue;
  });

  renderer.registerFilter('join', (value, separator = ', ') => {
    if (!Array.isArray(value)) return value;

    return value
      .map((item) => {
        if (typeof item === 'object' && item?.label) {
          return item.label;
        }
        return String(item);
      })
      .join(separator);
  });

  renderer.registerFilter('length', (value) => {
    if (Array.isArray(value) || typeof value === 'string') {
      return value.length;
    }
    return 0;
  });

  renderer.registerFilter('default', (value, defaultValue = '') => {
    return value !== undefined && value !== null && value !== '' ? value : defaultValue;
  });

  renderer.registerFilter('json', (value) => {
    try {
      return JSON.stringify(value);
    } catch {
      return JSON.stringify(String(value));
    }
  });

  renderer.registerFilter('number', (value, decimals = 0) => {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return value;
    return numericValue.toFixed(decimals);
  });

  renderer.registerFilter('currency', (value, currency = 'EUR') => {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return value;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency,
    }).format(numericValue);
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
    const differenceMs = now - date;
    const differenceMinutes = Math.floor(differenceMs / (1000 * 60));
    const differenceHours = Math.floor(differenceMs / (1000 * 60 * 60));
    const differenceDays = Math.floor(differenceMs / (1000 * 60 * 60 * 24));

    if (differenceMinutes < 1) return 'proprio ora';
    if (differenceMinutes < 60) {
      return `${differenceMinutes} ${differenceMinutes === 1 ? 'minuto' : 'minuti'} fa`;
    }
    if (differenceHours < 24) {
      return `${differenceHours} ${differenceHours === 1 ? 'ora' : 'ore'} fa`;
    }
    if (differenceDays < 30) {
      return `${differenceDays} ${differenceDays === 1 ? 'giorno' : 'giorni'} fa`;
    }

    return date.toLocaleDateString('it-IT');
  });

  renderer.registerFilter('slugify', (value) => utilSlug(value));
  renderer.registerFilter('urlencode', (value) => encodeURIComponent(String(value)));
  renderer.registerFilter('tagHref', (tag) => getTagHref(tag));
  renderer.registerFilter('tagLabel', (tag) => getTagLabel(tag));

  renderer.registerFilter('slice', (value, start = 0, end = undefined) => {
    if (Array.isArray(value) || typeof value === 'string') {
      return value.slice(start, end);
    }
    return value;
  });

  renderer.registerFilter('markdown', (value) => {
    try {
      return marked(String(value), markedOptions);
    } catch {
      return String(value);
    }
  });

  renderer.registerFilter('pad', (value, length = 2, char = '0') => {
    return String(value).padStart(length, char);
  });

  renderer.registerFilter('groupBy', (array, property) => {
    if (!Array.isArray(array)) return array;

    return array.reduce((groups, item) => {
      const key = item[property];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  });

  renderer.registerFilter('sortBy', (array, property, direction = 'asc') => {
    if (!Array.isArray(array)) return array;

    return [...array].sort((left, right) => {
      let leftValue = left[property];
      let rightValue = right[property];

      if (property === 'date') {
        leftValue = new Date(leftValue);
        rightValue = new Date(rightValue);
      }

      if (direction === 'desc') {
        return leftValue < rightValue ? 1 : leftValue > rightValue ? -1 : 0;
      }

      return leftValue > rightValue ? 1 : leftValue < rightValue ? -1 : 0;
    });
  });

  renderer.registerFilter('', (value) => value);
}
