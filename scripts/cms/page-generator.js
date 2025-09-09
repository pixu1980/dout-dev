// CMS Page Generator - generates HTML pages using proper templates
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDir } from './utils.js';
import { TemplateRenderer } from '../template-engine/renderer.js';

export function generatePages(dataset, config) {
  const renderer = new TemplateRenderer(process.cwd());
  // M7: generate static pages (home, about, 404, playground, offline)
  generateStaticPages(dataset, config, renderer);
  generatePosts(dataset.posts, config, renderer);
  generateTags(dataset.tags, config, renderer);
  generateMonths(dataset.months, config, renderer);
  generateSeries(dataset.series, config, renderer);
}

function getSiteMeta(config) {
  const meta = config?.SITE_META || {};
  return {
    baseUrl: meta.baseUrl || '',
    url: meta.url || '',
    title: meta.title || 'dout.dev',
  };
}

// Normalize baseUrl + path to avoid double slashes in generated hrefs
function joinUrl(base, path) {
  const b = String(base || '').replace(/\/+$/, '');
  const p = String(path || '').replace(/^\/+/, '');
  // Ensure single slash between base and path; allow trailing slash in path when provided
  return `${b}/${p}`.replace(/^\/+/, '/');
}

function generatePosts(posts, config, renderer) {
  if (!posts || !Array.isArray(posts)) return;

  const { url } = getSiteMeta(config);

  // Filter published posts and sort by date
  const publishedPosts = posts
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  for (let i = 0; i < publishedPosts.length; i++) {
    const post = publishedPosts[i];

    // Calculate next and previous posts
    const nextPost = i > 0 ? publishedPosts[i - 1] : null;
    const prevPost = i < publishedPosts.length - 1 ? publishedPosts[i + 1] : null;

    // Add navigation properties to post
    const postWithNav = {
      ...post,
      // Ensure post url is available for templates (share links, canonical, etc.)
      url: `/posts/${post.name}.html`,
      next: nextPost ? { title: nextPost.title, url: `/posts/${nextPost.name}.html` } : null,
      prev: prevPost ? { title: prevPost.title, url: `/posts/${prevPost.name}.html` } : null,
    };

    // Find related posts based on tags (simple algorithm)
    const relatedPosts = publishedPosts
      .filter((p) => p.name !== post.name) // Exclude current post
      .filter((p) => p.tags && post.tags && p.tags.some((tag) => post.tags.includes(tag))) // Same tags
      .slice(0, 3); // Take first 3

    // Use the proper post.html template
    try {
      const html = renderer.render('src/templates/post.html', {
        post: postWithNav,
        title: post.title,
        current: 'posts',
        canonicalUrl: joinUrl(url, `posts/${post.name}.html`),
        description: post.excerpt || post.description,
        relatedPosts: relatedPosts, // Always provide as array
        relatedSeries: [], // TODO: implementare serie correlate
        site: config.SITE_META,
      });
      ensureDir(config.postsOutputDir);
      writeFileSync(join(config.postsOutputDir, `${post.name}.html`), html, 'utf8');
    } catch (error) {
      console.warn(
        `Warning: Failed to render post ${post.name} with template, falling back to basic HTML - ${error?.message || error}`
      );
      // Fallback to basic template if sophisticated template fails
      const tpl = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }} - {{ site.title }}</title>
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  <main>
    <article>
      <h1>{{ title }}</h1>
      <div>{{ content | raw }}</div>
    </article>
  </main>
</body>
</html>`;
      const html = renderer.renderString(tpl, { ...post, site: config.SITE_META });
      ensureDir(config.postsOutputDir);
      writeFileSync(join(config.postsOutputDir, `${post.name}.html`), html, 'utf8');
    }
  }
}

function generateTags(tags, config, renderer) {
  if (!tags || !Array.isArray(tags)) return;

  for (const tag of tags) {
    const tagForTpl = { ...tag, name: tag.label || tag.name, slug: tag.key || tag.slug };
    const { baseUrl, url, title } = getSiteMeta(config);
    const feedPath = join(config.tagsOutputDir, `${tag.key}.xml`);
    const baseHtmlHref = joinUrl(baseUrl, `tags/${tagForTpl.slug}.html`);
    const baseFolderHref = joinUrl(baseUrl, `tags/${tagForTpl.slug}/`);
    const items = (tag.posts || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    generatePaginatedList({
      items,
      pageSize: config.PAGE_SIZE || 10,
      baseHtmlHref,
      baseFolderHref,
      outDir: config.tagsOutputDir,
      pageKey: tag.key,
      render: (ctx) =>
        renderer.render('src/templates/tag.html', {
          tag: tagForTpl,
          posts: ctx.itemsPage,
          title:
            ctx.page === 1
              ? `${tagForTpl.name} Posts`
              : `${tagForTpl.name} Posts — Page ${ctx.page}`,
          current: 'tags',
          canonicalUrl:
            ctx.page === 1
              ? joinUrl(url, `tags/${tagForTpl.slug}.html`)
              : joinUrl(url, `tags/${tagForTpl.slug}/${ctx.page}/`),
          feedUrl: joinUrl(url, `tags/${tagForTpl.slug}.xml`),
          description: `Posts tagged with ${tagForTpl.name}${ctx.page > 1 ? ` — Page ${ctx.page}` : ''}`,
          sortBy: 'date-desc',
          viewMode: 'list',
          pagination: ctx.pagination,
          relatedTags: [],
          site: config.SITE_META,
        }),
    });

    // Feed
    const tagFeedXml = buildRssFeed({
      title: `${title} — ${tagForTpl.name}`,
      link: `${url}/tags/${tagForTpl.slug}/`,
      description: `RSS feed for posts tagged with ${tagForTpl.name}`,
      items,
      siteUrl: url,
    });
    writeFileSync(feedPath, tagFeedXml, 'utf8');
  }
}

function generateMonths(months, config, renderer) {
  if (!months || !Array.isArray(months)) return;

  for (const month of months) {
    // Tags for month (kept)
    const allTags = new Set();
    month.posts.forEach((post) => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((t) => {
          allTags.add(t);
        });
      }
    });
    const monthTags = Array.from(allTags).sort();

    const monthForTpl = {
      ...month,
      name: month.label || month.name,
      number: month.month || month.number,
      slug: month.key || month.slug,
    };
    const { baseUrl, url, title } = getSiteMeta(config);
    const feedPath = join(config.monthsOutputDir, `${month.key}.xml`);
    const baseHtmlHref = joinUrl(baseUrl, `months/${monthForTpl.slug}.html`);
    const baseFolderHref = joinUrl(baseUrl, `months/${monthForTpl.slug}/`);
    const items = (month.posts || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    generatePaginatedList({
      items,
      pageSize: config.PAGE_SIZE || 10,
      baseHtmlHref,
      baseFolderHref,
      outDir: config.monthsOutputDir,
      pageKey: month.key,
      render: (ctx) =>
        renderer.render('src/templates/month.html', {
          month: monthForTpl,
          monthTags,
          posts: ctx.itemsPage,
          title: ctx.page === 1 ? `${monthForTpl.name}` : `${monthForTpl.name} — Page ${ctx.page}`,
          current: 'posts',
          canonicalUrl:
            ctx.page === 1
              ? joinUrl(url, `months/${monthForTpl.slug}.html`)
              : joinUrl(url, `months/${monthForTpl.slug}/${ctx.page}/`),
          feedUrl: joinUrl(url, `months/${monthForTpl.slug}.xml`),
          description: `Posts from ${monthForTpl.name}${ctx.page > 1 ? ` — Page ${ctx.page}` : ''}`,
          showStats: true,
          variant: 'month',
          pagination: ctx.pagination,
          site: config.SITE_META,
        }),
    });

    // Feed
    const monthFeedXml = buildRssFeed({
      title: `${title} — ${monthForTpl.name}`,
      link: `${url}/months/${monthForTpl.slug}/`,
      description: `RSS feed for posts from ${monthForTpl.name}`,
      items,
      siteUrl: url,
    });
    writeFileSync(feedPath, monthFeedXml, 'utf8');
  }
}

function generateSeries(series, config, renderer) {
  if (!series || !Array.isArray(series)) return;

  for (const serie of series) {
    const { baseUrl, url } = getSiteMeta(config);
    const baseHtmlHref = joinUrl(baseUrl, `series/${serie.slug}.html`);
    const baseFolderHref = joinUrl(baseUrl, `series/${serie.slug}/`);
    const items = (serie.posts || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    generatePaginatedList({
      items,
      pageSize: config.PAGE_SIZE || 10,
      baseHtmlHref,
      baseFolderHref,
      outDir: config.seriesOutputDir,
      pageKey: `${serie.slug}`,
      render: (ctx) =>
        renderer.render('src/templates/series.html', {
          series: serie,
          posts: ctx.itemsPage,
          title: ctx.page === 1 ? `${serie.title}` : `${serie.title} — Page ${ctx.page}`,
          current: 'posts',
          canonicalUrl:
            ctx.page === 1
              ? joinUrl(url, `series/${serie.slug}.html`)
              : joinUrl(url, `series/${serie.slug}/${ctx.page}/`),
          description: serie.description,
          relatedSeries: [],
          variant: 'series',
          pagination: ctx.pagination,
          site: config.SITE_META,
        }),
    });
  }
}

// escapeHtml was used in legacy fallbacks; keep escapeXml only

export function escapeXml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildRssFeed({ title, link, description, items, siteUrl }) {
  const safeTitle = escapeXml(title);
  const safeDesc = escapeXml(description);
  const now = new Date().toUTCString();
  const channelItems = (items || [])
    .filter((p) => p && p.published !== false)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20)
    .map((p) => {
      const itemTitle = escapeXml(p.title || p.name);
      const itemLink = `${siteUrl}/posts/${p.name}.html`;
      const guid = `${siteUrl}/posts/${p.name}.html`;
      const pubDate = p.date ? new Date(p.date).toUTCString() : now;
      const desc = escapeXml(p.excerpt || '');
      return (
        `    <item>\n` +
        `      <title>${itemTitle}</title>\n` +
        `      <link>${itemLink}</link>\n` +
        `      <guid isPermaLink="true">${guid}</guid>\n` +
        `      <pubDate>${pubDate}</pubDate>\n` +
        (desc ? `      <description>${desc}</description>\n` : '') +
        `    </item>`
      );
    })
    .join('\n');

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0">\n` +
    `  <channel>\n` +
    `    <title>${safeTitle}</title>\n` +
    `    <link>${escapeXml(link)}</link>\n` +
    `    <description>${safeDesc}</description>\n` +
    `    <lastBuildDate>${now}</lastBuildDate>\n` +
    (channelItems ? `${channelItems}\n` : '') +
    `  </channel>\n` +
    `</rss>\n`;
  return xml;
}

// M7: generate static site pages
function generateStaticPages(dataset, config, renderer) {
  const { url } = getSiteMeta(config);

  // Home: latest posts with pinned on top
  try {
    const published = (dataset.posts || []).filter((p) => p?.published).slice();
    // Pinned first, then by date desc
    published.sort((a, b) => {
      const pinA = a.pinned ? 1 : 0;
      const pinB = b.pinned ? 1 : 0;
      if (pinA !== pinB) return pinB - pinA;
      return new Date(b.date) - new Date(a.date);
    });
    const latest = published.slice(0, Math.max(10, config.PAGE_SIZE || 10));
    const html = renderer.render('src/templates/home.html', {
      title: config.SITE_META?.title || 'dout.dev',
      description: config.SITE_META?.description,
      canonicalUrl: joinUrl(url, '/'),
      feedUrl: joinUrl(url, 'feed.xml'),
      posts: latest,
      site: config.SITE_META,
    });
    ensureDir('src');
    writeFileSync(join('src', 'index.html'), html, 'utf8');
  } catch (e) {
    console.warn('Warning: failed to generate home page:', e?.message || e);
  }

  // About
  try {
    const html = renderer.render('src/templates/about.html', {
      title: 'About',
      canonicalUrl: joinUrl(url, 'about.html'),
      site: config.SITE_META,
    });
    writeFileSync(join('src', 'about.html'), html, 'utf8');
  } catch (e) {
    console.warn('Warning: failed to generate about page:', e?.message || e);
  }

  // Playground
  try {
    const html = renderer.render('src/templates/playground.html', {
      title: 'Playground',
      canonicalUrl: joinUrl(url, 'playground.html'),
      site: config.SITE_META,
    });
    writeFileSync(join('src', 'playground.html'), html, 'utf8');
  } catch (e) {
    console.warn('Warning: failed to generate playground page:', e?.message || e);
  }

  // 404
  try {
    const html = renderer.render('src/templates/404.html', {
      title: 'Page Not Found',
      canonicalUrl: joinUrl(url, '404.html'),
      site: config.SITE_META,
    });
    writeFileSync(join('src', '404.html'), html, 'utf8');
  } catch (e) {
    console.warn('Warning: failed to generate 404 page:', e?.message || e);
  }

  // Offline
  try {
    const html = renderer.render('src/templates/offline.html', {
      title: 'Offline',
      canonicalUrl: joinUrl(url, 'offline.html'),
      site: config.SITE_META,
    });
    writeFileSync(join('src', 'offline.html'), html, 'utf8');
  } catch (e) {
    console.warn('Warning: failed to generate offline page:', e?.message || e);
  }
}

function buildPagination(page, pageCount, baseHtmlHref, baseFolderHref) {
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const pages = [];
  const addPage = (p) => {
    pages.push({
      page: p,
      href: p === 1 ? baseHtmlHref : `${baseFolderHref}${p}/`,
      current: p === page,
    });
  };
  const addEllipsis = () => pages.push({ gap: true, label: '…' });

  const window = 2;
  const start = clamp(page - window, 1, pageCount);
  const end = clamp(page + window, 1, pageCount);

  addPage(1);
  if (start > 2) addEllipsis();
  for (let p = Math.max(2, start); p <= Math.min(end, pageCount - 1); p++) addPage(p);
  if (end < pageCount - 1) addEllipsis();
  if (pageCount > 1) addPage(pageCount);

  const prev = page > 1 ? page - 1 : null;
  const next = page < pageCount ? page + 1 : null;
  return {
    page,
    pageCount,
    pages,
    firstHref: baseHtmlHref,
    lastHref: pageCount > 1 ? `${baseFolderHref}${pageCount}/` : baseHtmlHref,
    prevHref: prev ? (prev === 1 ? baseHtmlHref : `${baseFolderHref}${prev}/`) : null,
    nextHref: next ? `${baseFolderHref}${next}/` : null,
  };
}

// Generic helper to reduce complexity of paginated list generation
function generatePaginatedList({
  items,
  pageSize,
  baseHtmlHref,
  baseFolderHref,
  outDir,
  pageKey,
  render,
}) {
  try {
    const sorted = (items || []).slice();
    const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
    for (let page = 1; page <= pageCount; page++) {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const itemsPage = sorted.slice(start, end);
      const pagination =
        pageCount > 1 ? buildPagination(page, pageCount, baseHtmlHref, baseFolderHref) : null;
      const canonicalUrl = page === 1 ? baseHtmlHref : `${baseFolderHref}${page}/`;
      const html = render({ page, pageCount, itemsPage, pagination, canonicalUrl });
      ensureDir(outDir);
      if (page === 1) {
        writeFileSync(join(outDir, `${pageKey}.html`), html, 'utf8');
      } else {
        const outDirPage = join(outDir, pageKey, String(page));
        ensureDir(outDirPage);
        writeFileSync(join(outDirPage, `index.html`), html, 'utf8');
      }
    }
  } catch (error) {
    console.warn('Paginated list generation failed:', error?.message || error);
  }
}
