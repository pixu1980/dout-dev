/* Client-side search (M10) - vanilla, no deps */

const PAGE_SIZE = 10;

async function loadJson(path) {
  const res = await fetch(path, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function getQueryParam(name) {
  const params = new URLSearchParams(location.search);
  return params.get(name) || '';
}

function getQueryParamsAll(name) {
  const params = new URLSearchParams(location.search);
  return params.getAll(name);
}

function normalizeText(s) {
  return (s || '').toString().toLowerCase();
}

function scorePost(p, q) {
  const title = normalizeText(p.title);
  const excerpt = normalizeText(p.excerpt);
  const tagsText = normalizeText((p.tags || []).map((t) => t.label).join(' '));
  let s = 0;
  if (title.includes(q)) s += 3;
  if (tagsText.includes(q)) s += 2;
  if (excerpt.includes(q)) s += 1;
  if (Array.isArray(p.keywords) && p.keywords.some((kw) => normalizeText(kw) === q)) s += 2; // boost exact keyword match
  return s;
}

function scoreTag(t, q) {
  const hay = [t.label, t.name, t.slug].join(' ');
  return normalizeText(hay).includes(q) ? 1 : 0;
}

function scoreSeries(s, q) {
  const hay = [s.title, s.slug].join(' ');
  return normalizeText(hay).includes(q) ? 1 : 0;
}

function scoreMonth(m, q) {
  const hay = [m.label, m.slug, m.key].join(' ');
  return normalizeText(hay).includes(q) ? 1 : 0;
}

function renderResultItem(p) {
  const el = document.createElement('article');
  el.className = 'post-card';
  el.setAttribute('role', 'listitem');
  el.innerHTML = `
    <header class="post-card__header">
      <span class="badge" aria-hidden="true">Post</span>
      <h2 class="post-card__title"><a href="/posts/${p.name}.html">${p.title}</a></h2>
    </header>
    <p class="post-card__meta"><time datetime="${p.date}">${p.dateString || p.date || ''}</time></p>
    <p class="post-card__excerpt">${p.excerpt || ''}</p>
  `;
  return el;
}

function renderTagItem(t) {
  const el = document.createElement('article');
  el.className = 'post-card';
  el.setAttribute('role', 'listitem');
  el.innerHTML = `
    <header class="post-card__header">
      <span class="badge" aria-hidden="true">Tag</span>
      <h2 class="post-card__title"><a href="/tags/${t.slug}.html">${t.label || t.name}</a></h2>
    </header>
    <p class="post-card__meta">${t.count || 0} post(s)</p>
  `;
  return el;
}

function renderSeriesItem(s) {
  const el = document.createElement('article');
  el.className = 'post-card';
  el.setAttribute('role', 'listitem');
  el.innerHTML = `
    <header class="post-card__header">
      <span class="badge" aria-hidden="true">Series</span>
      <h2 class="post-card__title"><a href="/series/${s.slug}.html">${s.title}</a></h2>
    </header>
    <p class="post-card__meta">${s.count || s.posts?.length || 0} post(s)</p>
    <p class="post-card__excerpt">A series of posts about ${s.title}.</p>
  `;
  return el;
}

function renderMonthItem(m) {
  const el = document.createElement('article');
  el.className = 'post-card';
  el.setAttribute('role', 'listitem');
  el.innerHTML = `
    <header class="post-card__header">
      <span class="badge" aria-hidden="true">Month</span>
      <h2 class="post-card__title"><a href="/months/${m.slug || m.key}.html">${m.label || m.name}</a></h2>
    </header>
    <p class="post-card__meta">${m.count || 0} post(s)</p>
  `;
  return el;
}

function renderPagination(container, total, page, onPage) {
  container.innerHTML = '';
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return;

  // Helper to build URL preserving q and type params
  const buildHref = (targetPage) => {
    const url = new URL(location.href);
    if (targetPage <= 1) {
      url.searchParams.delete('page');
    } else {
      url.searchParams.set('page', String(targetPage));
    }
    return url.toString();
  };

  // Prev link
  if (page > 1) {
    const prev = document.createElement('a');
    prev.rel = 'prev';
    prev.href = buildHref(page - 1);
    prev.textContent = 'Prev';
    prev.dataset.page = String(page - 1);
    container.appendChild(prev);
  }

  // Page list
  const ul = document.createElement('ul');
  for (let i = 1; i <= pages; i++) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = buildHref(i);
    a.textContent = String(i);
    a.dataset.page = String(i);
    if (i === page) a.setAttribute('aria-current', 'page');
    li.appendChild(a);
    ul.appendChild(li);
  }
  container.appendChild(ul);

  // Next link
  if (page < pages) {
    const next = document.createElement('a');
    next.rel = 'next';
    next.href = buildHref(page + 1);
    next.textContent = 'Next';
    next.dataset.page = String(page + 1);
    container.appendChild(next);
  }

  // Event delegation to keep SPA-like behavior
  const onClick = (e) => {
    const target = e.target;
    if (target && target instanceof HTMLAnchorElement && target.dataset.page) {
      const targetPage = parseInt(target.dataset.page, 10);
      if (!Number.isNaN(targetPage)) {
        e.preventDefault();
        onPage(targetPage);
      }
    }
  };
  // Remove previous handler if any to avoid stacking
  container.removeEventListener('click', container._onClickPag);
  container._onClickPag = onClick;
  container.addEventListener('click', onClick);
}

async function initClientSearch() {
  const resultsList = document.getElementById('search-results');
  const summary = document.getElementById('results-summary');
  const pagination = document.getElementById('search-pagination');
  const input = document.getElementById('q');
  if (!resultsList || !input) return;

  const q = normalizeText(getQueryParam('q'));
  const initialPage = Math.max(1, parseInt(getQueryParam('page') || '1', 10) || 1);
  const initialTypes = new Set(getQueryParamsAll('type'));
  if (q) input.value = q;

  // Load indexes in parallel
  const [posts, tags, months, series] = await Promise.all([
    loadJson('/data/posts.json'),
    loadJson('/data/tags.json'),
    loadJson('/data/months.json'),
    loadJson('/data/series.json'),
  ]);

  function buildResults(term, types) {
    const postResults = posts
      .map((p) => ({ type: 'post', item: p, score: scorePost(p, term), sortKey: p.date || '' }))
      .filter((x) => x.score > 0);
    const tagResults = tags
      .map((t) => ({
        type: 'tag',
        item: t,
        score: scoreTag(t, term),
        sortKey: String(t.count || 0).padStart(5, '0'),
      }))
      .filter((x) => x.score > 0);
    const seriesResults = series
      .map((s) => ({
        type: 'series',
        item: s,
        score: scoreSeries(s, term),
        sortKey: String(s.count || s.posts?.length || 0).padStart(5, '0'),
      }))
      .filter((x) => x.score > 0);
    const monthResults = months
      .map((m) => ({
        type: 'month',
        item: m,
        score: scoreMonth(m, term),
        sortKey: m.key || m.slug || '',
      }))
      .filter((x) => x.score > 0);

    const counts = {
      posts: postResults.length,
      tags: tagResults.length,
      series: seriesResults.length,
      months: monthResults.length,
    };

    const typeWeight = { post: 3, tag: 2, series: 1, month: 0 };
    let combined = [...postResults, ...tagResults, ...seriesResults, ...monthResults].sort(
      (a, b) => {
        if (typeWeight[b.type] !== typeWeight[a.type])
          return typeWeight[b.type] - typeWeight[a.type];
        return (b.sortKey || '').localeCompare(a.sortKey || '');
      }
    );
    // Filter by type if provided
    if (types && types.size) {
      combined = combined.filter((x) => types.has(x.type));
    }
    return { combined, counts };
  }

  const renderers = {
    post: renderResultItem,
    tag: renderTagItem,
    series: renderSeriesItem,
    month: renderMonthItem,
  };

  function updateSummaryEl(total, counts) {
    if (total) {
      summary.textContent = `${total} result(s) — posts ${counts.posts}, tags ${counts.tags}, series ${counts.series}, months ${counts.months}`;
    } else {
      summary.textContent = 'No results';
    }
  }

  const apply = (query, page = 1) => {
    const term = normalizeText(query);
    const currentTypes = new Set(getQueryParamsAll('type'));
    const { combined, counts } = buildResults(term, currentTypes);

    const total = combined.length;
    const start = (page - 1) * PAGE_SIZE;
    const pageItems = combined.slice(start, start + PAGE_SIZE);

    resultsList.innerHTML = '';
    for (const entry of pageItems) {
      const renderer = renderers[entry.type];
      if (renderer) resultsList.appendChild(renderer(entry.item));
    }
    updateSummaryEl(total, counts);
    renderPagination(pagination, total, page, (nextPage) => {
      const url = new URL(location.href);
      url.searchParams.set('q', term);
      url.searchParams.set('page', String(nextPage));
      history.replaceState({}, '', url);
      apply(term, nextPage);
      // Announce page change for screen readers
      summary.textContent = `${summary.textContent} — page ${nextPage}`;
    });
  };

  const initial = q || input.value;
  if (initial) apply(initial, initialPage);

  const form = document.getElementById('search-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const term = input.value;
    const url = new URL(location.href);
    url.searchParams.set('q', term);
    url.searchParams.set('page', '1');
    // Collect checked types
    const checked = Array.from(form.querySelectorAll('input[name="type"]:checked')).map(
      (el) => el.value
    );
    url.searchParams.delete('type');
    for (const t of checked) url.searchParams.append('type', t);
    history.replaceState({}, '', url);
    apply(term, 1);
  });

  // Initialize checkboxes from URL
  const checkboxes = Array.from(document.querySelectorAll('input[name="type"]'));
  if (initialTypes.size) {
    checkboxes.forEach((cb) => {
      cb.checked = initialTypes.has(cb.value);
    });
  }

  // Keyboard shortcut '/' to focus the search input
  document.addEventListener('keydown', (e) => {
    if (
      e.key === '/' &&
      !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
    ) {
      e.preventDefault();
      input.focus();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClientSearch);
} else {
  initClientSearch();
}

export { initClientSearch };
