/* Client-side search (M10/M13) - vanilla, no deps */

import { refreshPostFeedLayouts } from './post-feed-layout.js';

const PAGE_SIZE = 10;

// Tags whose display label should be fully uppercase (keep in sync with _filters.js)
const TAG_UPPERCASE_MAP = new Map([
  ['css', 'CSS'],
  ['html', 'HTML'],
]);

function applyTagDisplayCase(label) {
  const key = String(label).toLowerCase().trim();
  return TAG_UPPERCASE_MAP.get(key) || label;
}

let searchIndexesPromise = null;
let idleWarmupHandle = 0;
let activeCleanup = null;

function focusSummary(summary) {
  if (!(summary instanceof HTMLElement)) return;

  if (!summary.hasAttribute('tabindex')) {
    summary.setAttribute('tabindex', '-1');
  }

  summary.focus({ preventScroll: true });
  summary.scrollIntoView({ block: 'nearest' });
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function loadJson(path) {
  const res = await fetch(path, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function scheduleIdle(callback, timeout = 1600) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout });
  }

  return window.setTimeout(() => callback({ didTimeout: true, timeRemaining: () => 0 }), 250);
}

function cancelIdle(handle) {
  if (!handle) return;

  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle);
    return;
  }

  window.clearTimeout(handle);
}

function getQueryParam(name) {
  const params = new URLSearchParams(location.search);
  return params.get(name) || '';
}

function getQueryParamsAll(name) {
  const params = new URLSearchParams(location.search);
  return params.getAll(name);
}

function normalizeText(value) {
  return (value || '').toString().toLowerCase();
}

function scorePost(post, query) {
  const title = normalizeText(post.title);
  const excerpt = normalizeText(post.excerpt);
  const tagsText = normalizeText((post.tags || []).map((tag) => tag.label).join(' '));
  let score = 0;

  if (title.includes(query)) score += 3;
  if (tagsText.includes(query)) score += 2;
  if (excerpt.includes(query)) score += 1;
  if (
    Array.isArray(post.keywords) &&
    post.keywords.some((keyword) => normalizeText(keyword) === query)
  ) {
    score += 2;
  }

  return score;
}

function scoreTag(tag, query) {
  const haystack = [tag.label, tag.name, tag.slug].join(' ');
  return normalizeText(haystack).includes(query) ? 1 : 0;
}

function scoreSeries(series, query) {
  const haystack = [series.title, series.slug].join(' ');
  return normalizeText(haystack).includes(query) ? 1 : 0;
}

function scoreMonth(month, query) {
  const haystack = [month.label, month.slug, month.key].join(' ');
  return normalizeText(haystack).includes(query) ? 1 : 0;
}

function renderResultItem(post) {
  const item = document.createElement('li');
  const tagsMarkup =
    Array.isArray(post.tags) && post.tags.length
      ? `<footer class="post-card__footer"><ul class="post-card__tags" aria-label="Post topics">${post.tags
          .map(
            (tag) =>
              `<li><a class="tag tag--small" href="/tags/${escapeHtml(tag.key || tag.slug || tag.label || tag.name)}.html">${escapeHtml(applyTagDisplayCase(tag.label || tag.name || tag.key))}</a></li>`
          )
          .join('')}</ul></footer>`
      : '';
  const mediaMarkup = post.coverImage
    ? `<figure class="post-card__media"><a href="/posts/${escapeHtml(post.name)}.html" tabindex="-1"><img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.coverAlt || post.title)}" loading="lazy" decoding="async" /></a></figure>`
    : '';
  const cardClass = post.coverImage ? 'post-card post-card--with-media' : 'post-card';

  item.className = 'post-feed__item';
  item.innerHTML = `
    <article class="${cardClass}">
      ${mediaMarkup}
      <div class="post-card__body">
        <header class="post-card__header">
          <p class="post-card__meta"><time datetime="${escapeHtml(post.date)}">${escapeHtml(post.dateString || post.date || '')}</time></p>
          <h2 class="post-card__title"><a href="/posts/${escapeHtml(post.name)}.html">${escapeHtml(post.title)}</a></h2>
        </header>
        <p class="post-card__excerpt">${escapeHtml(post.excerpt || '')}</p>
      </div>
      ${tagsMarkup}
    </article>
  `;

  return item;
}

function renderTagItem(tag) {
  const item = document.createElement('li');

  item.className = 'post-feed__item';
  item.innerHTML = `
    <article class="post-card">
      <div class="post-card__body">
        <header class="post-card__header">
          <p class="post-card__meta">Tag</p>
          <h2 class="post-card__title"><a href="/tags/${escapeHtml(tag.slug)}.html">${escapeHtml(applyTagDisplayCase(tag.label || tag.name))}</a></h2>
        </header>
        <p class="post-card__excerpt">${escapeHtml(String(tag.count || 0))} post(s)</p>
      </div>
    </article>
  `;

  return item;
}

function renderSeriesItem(series) {
  const item = document.createElement('li');

  item.className = 'post-feed__item';
  item.innerHTML = `
    <article class="post-card">
      <div class="post-card__body">
        <header class="post-card__header">
          <p class="post-card__meta">Series</p>
          <h2 class="post-card__title"><a href="/series/${escapeHtml(series.slug)}.html">${escapeHtml(series.title)}</a></h2>
        </header>
        <p class="post-card__excerpt">${escapeHtml(`A series of posts about ${series.title}.`)}</p>
      </div>
      <footer class="post-card__footer">
        <p class="post-card__meta">${escapeHtml(String(series.count || series.posts?.length || 0))} post(s)</p>
      </footer>
    </article>
  `;

  return item;
}

function renderMonthItem(month) {
  const item = document.createElement('li');

  item.className = 'post-feed__item';
  item.innerHTML = `
    <article class="post-card">
      <div class="post-card__body">
        <header class="post-card__header">
          <p class="post-card__meta">Month</p>
          <h2 class="post-card__title"><a href="/months/${escapeHtml(month.slug || month.key)}.html">${escapeHtml(month.label || month.name)}</a></h2>
        </header>
        <p class="post-card__excerpt">${escapeHtml(String(month.count || 0))} post(s)</p>
      </div>
    </article>
  `;

  return item;
}

function buildPaginationModel(total, page) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = [];
  const windowSize = 2;
  const start = Math.max(1, page - windowSize);
  const end = Math.min(pages, page + windowSize);

  const addPage = (number) => {
    items.push({
      ariaLabel: number === page ? `Page ${number}, current page` : `Go to page ${number}`,
      current: number === page,
      page: number,
    });
  };

  const addGap = () => items.push({ gap: true });

  addPage(1);
  if (start > 2) addGap();
  for (let number = Math.max(2, start); number <= Math.min(end, pages - 1); number += 1) {
    addPage(number);
  }
  if (end < pages - 1) addGap();
  if (pages > 1) addPage(pages);

  return { items, pages };
}

function renderPagination(container, total, page, onPage) {
  container.innerHTML = '';
  const { items, pages } = buildPaginationModel(total, page);
  if (pages <= 1) return;

  const buildHref = (targetPage) => {
    const url = new URL(location.href);
    if (targetPage <= 1) {
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('page', String(targetPage));
    }
    return url.toString();
  };

  const appendEdge = ({ ariaLabel, pageNumber, rel, text }) => {
    const anchor = document.createElement('a');
    anchor.className = 'pagination__edge';
    anchor.href = buildHref(pageNumber);
    anchor.textContent = text;
    anchor.dataset.page = String(pageNumber);
    anchor.setAttribute('aria-label', ariaLabel);
    if (rel) {
      anchor.rel = rel;
    }
    container.appendChild(anchor);
  };

  if (page > 1) {
    appendEdge({ ariaLabel: 'Go to first page', pageNumber: 1, text: 'First' });
    appendEdge({
      ariaLabel: `Go to previous page, page ${page - 1}`,
      pageNumber: page - 1,
      rel: 'prev',
      text: 'Prev',
    });
  }

  const ul = document.createElement('ul');
  ul.className = 'pagination__list';
  ul.setAttribute('role', 'list');

  items.forEach((item) => {
    const li = document.createElement('li');

    if (item.gap) {
      const gap = document.createElement('span');
      gap.className = 'pagination__gap';
      gap.setAttribute('aria-hidden', 'true');
      gap.textContent = '...';
      li.appendChild(gap);

      const hidden = document.createElement('span');
      hidden.className = 'visually-hidden';
      hidden.textContent = 'Skipped pages';
      li.appendChild(hidden);
      ul.appendChild(li);
      return;
    }

    const anchor = document.createElement('a');
    anchor.className = 'pagination__link';
    anchor.href = buildHref(item.page);
    anchor.textContent = String(item.page);
    anchor.dataset.page = String(item.page);
    anchor.setAttribute('aria-label', item.ariaLabel);
    if (item.current) anchor.setAttribute('aria-current', 'page');
    li.appendChild(anchor);
    ul.appendChild(li);
  });
  container.appendChild(ul);

  if (page < pages) {
    appendEdge({
      ariaLabel: `Go to next page, page ${page + 1}`,
      pageNumber: page + 1,
      rel: 'next',
      text: 'Next',
    });
    appendEdge({ ariaLabel: `Go to last page, page ${pages}`, pageNumber: pages, text: 'Last' });
  }

  const onClick = (event) => {
    const target = event.target;
    if (target && target instanceof HTMLAnchorElement && target.dataset.page) {
      const targetPage = parseInt(target.dataset.page, 10);
      if (!Number.isNaN(targetPage)) {
        event.preventDefault();
        onPage(targetPage);
      }
    }
  };

  container.removeEventListener('click', container._onClickPag);
  container._onClickPag = onClick;
  container.addEventListener('click', onClick);
}

export function preloadSearchIndexes() {
  if (!searchIndexesPromise) {
    searchIndexesPromise = Promise.all([
      loadJson('/data/posts.json'),
      loadJson('/data/tags.json'),
      loadJson('/data/months.json'),
      loadJson('/data/series.json'),
    ]).then(([posts, tags, months, series]) => ({ posts, tags, months, series }));
  }

  return searchIndexesPromise;
}

function warmSearchIndexes() {
  if (searchIndexesPromise || idleWarmupHandle) return;
  if (navigator.connection?.saveData) return;

  idleWarmupHandle = scheduleIdle(() => {
    idleWarmupHandle = 0;
    void preloadSearchIndexes().catch(() => {});
  });
}

function buildResults(indexes, term, types) {
  const { posts, tags, months, series } = indexes;
  const postResults = posts
    .map((post) => ({
      type: 'post',
      item: post,
      score: scorePost(post, term),
      sortKey: post.date || '',
    }))
    .filter((entry) => entry.score > 0);
  const tagResults = tags
    .map((tag) => ({
      type: 'tag',
      item: tag,
      score: scoreTag(tag, term),
      sortKey: String(tag.count || 0).padStart(5, '0'),
    }))
    .filter((entry) => entry.score > 0);
  const seriesResults = series
    .map((entry) => ({
      type: 'series',
      item: entry,
      score: scoreSeries(entry, term),
      sortKey: String(entry.count || entry.posts?.length || 0).padStart(5, '0'),
    }))
    .filter((entry) => entry.score > 0);
  const monthResults = months
    .map((month) => ({
      type: 'month',
      item: month,
      score: scoreMonth(month, term),
      sortKey: month.key || month.slug || '',
    }))
    .filter((entry) => entry.score > 0);

  const counts = {
    posts: postResults.length,
    tags: tagResults.length,
    series: seriesResults.length,
    months: monthResults.length,
  };

  const typeWeight = { post: 3, tag: 2, series: 1, month: 0 };
  let combined = [...postResults, ...tagResults, ...seriesResults, ...monthResults].sort(
    (left, right) => {
      if (typeWeight[right.type] !== typeWeight[left.type]) {
        return typeWeight[right.type] - typeWeight[left.type];
      }
      return (right.sortKey || '').localeCompare(left.sortKey || '');
    }
  );

  if (types?.size) {
    combined = combined.filter((entry) => types.has(entry.type));
  }

  return { combined, counts };
}

function updateSummary(summary, total, counts, page) {
  if (!total) {
    summary.textContent = 'No results';
    return;
  }

  const label = total === 1 ? 'result' : 'results';
  summary.textContent = `${total} ${label} — posts ${counts.posts}, tags ${counts.tags}, series ${counts.series}, months ${counts.months}${page > 1 ? ` — page ${page}` : ''}`;
}

export function destroyClientSearch() {
  cancelIdle(idleWarmupHandle);
  idleWarmupHandle = 0;
  activeCleanup?.();
  activeCleanup = null;
}

async function initClientSearch() {
  destroyClientSearch();

  const resultsList = document.getElementById('search-results');
  const summary = document.getElementById('results-summary');
  const pagination = document.getElementById('search-pagination');
  const input = document.getElementById('q');
  const form = document.getElementById('search-form');

  if (!resultsList || !summary || !pagination || !input || !form) {
    warmSearchIndexes();
    return;
  }

  const renderers = {
    post: renderResultItem,
    tag: renderTagItem,
    series: renderSeriesItem,
    month: renderMonthItem,
  };

  const initialQuery = normalizeText(getQueryParam('q'));
  const initialPage = Math.max(1, parseInt(getQueryParam('page') || '1', 10) || 1);
  const initialTypes = new Set(getQueryParamsAll('type'));
  let disposed = false;

  if (initialQuery) input.value = initialQuery;

  const checkboxes = Array.from(document.querySelectorAll('input[name="type"]'));
  if (initialTypes.size) {
    checkboxes.forEach((checkbox) => {
      checkbox.checked = initialTypes.has(checkbox.value);
    });
  }

  const apply = async (query, page = 1, options = {}) => {
    const term = normalizeText(query);

    if (!term) {
      resultsList.innerHTML = '';
      pagination.innerHTML = '';
      summary.textContent = 'Type a query to search posts, tags, series, and months.';
      if (options.focusSummary) {
        focusSummary(summary);
      }
      return;
    }

    summary.textContent = 'Loading search index...';
    const indexes = await preloadSearchIndexes();
    if (disposed) return;

    const currentTypes = new Set(getQueryParamsAll('type'));
    const { combined, counts } = buildResults(indexes, term, currentTypes);
    const total = combined.length;
    const start = (page - 1) * PAGE_SIZE;
    const pageItems = combined.slice(start, start + PAGE_SIZE);

    resultsList.innerHTML = '';
    for (const entry of pageItems) {
      const renderer = renderers[entry.type];
      if (renderer) resultsList.appendChild(renderer(entry.item));
    }

    refreshPostFeedLayouts();
    updateSummary(summary, total, counts, page);
    renderPagination(pagination, total, page, (nextPage) => {
      const url = new URL(location.href);
      url.searchParams.set('q', term);
      url.searchParams.set('page', String(nextPage));
      history.replaceState({}, '', url);
      void apply(term, nextPage, { focusSummary: true });
    });

    if (options.focusSummary) {
      focusSummary(summary);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const term = input.value;
    const url = new URL(location.href);
    url.searchParams.set('q', term);
    url.searchParams.set('page', '1');

    const checked = Array.from(form.querySelectorAll('input[name="type"]:checked')).map(
      (element) => element.value
    );
    url.searchParams.delete('type');
    for (const type of checked) {
      url.searchParams.append('type', type);
    }

    history.replaceState({}, '', url);
    void apply(term, 1, { focusSummary: true });
  };

  const onShortcut = (event) => {
    if (
      event.key === '/' &&
      !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
    ) {
      event.preventDefault();
      input.focus();
    }
  };

  form.addEventListener('submit', onSubmit);
  document.addEventListener('keydown', onShortcut);

  activeCleanup = () => {
    disposed = true;
    form.removeEventListener('submit', onSubmit);
    document.removeEventListener('keydown', onShortcut);
    if (pagination._onClickPag) {
      pagination.removeEventListener('click', pagination._onClickPag);
      delete pagination._onClickPag;
    }
  };

  if (initialQuery) {
    void apply(initialQuery, initialPage);
  } else {
    summary.textContent = 'Type a query to search posts, tags, series, and months.';
    warmSearchIndexes();
  }
}

export { initClientSearch };
