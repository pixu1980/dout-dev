// CMS Page Generator - generates HTML pages using proper templates
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TemplateRenderer } from '../template-engine/index.js';
import { getOgImagePath } from './_og-image-generator.js';
import { ensureDir } from './_utils.js';

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

function getSiteContext(config) {
  return config?.SITE_META || config?.site || {};
}

function getGlobalRssFeedPath(config) {
  return config?.SITE_META?.rssFeedPath || '/feed.rss';
}

function getGlobalJsonFeedPath(config) {
  return config?.SITE_META?.jsonFeedPath || '/feed.json';
}

// Normalize baseUrl + path to avoid double slashes in generated hrefs
function joinUrl(base, path) {
  const b = String(base || '').replace(/\/+$/, '');
  const p = String(path || '').replace(/^\/+/, '');
  // Ensure single slash between base and path; allow trailing slash in path when provided
  return `${b}/${p}`.replace(/^\/+/, '/');
}

function getOgImageUrl(config, kind, slug) {
  const { url } = getSiteMeta(config);
  return joinUrl(url, getOgImagePath(kind, slug));
}

function toTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

const DEFAULT_POST_FEED_STEP = 10;
const HOME_INITIAL_POSTS = 20;

function sortPostsByDateDesc(posts) {
  return (posts || [])
    .slice()
    .sort((left, right) => toTimestamp(right.date) - toTimestamp(left.date));
}

function sortPostsByPinnedThenDateDesc(posts) {
  return (posts || [])
    .slice()
    .sort(
      (left, right) =>
        Number(Boolean(right.pinned)) - Number(Boolean(left.pinned)) ||
        toTimestamp(right.date) - toTimestamp(left.date)
    );
}

export function buildPostFeedLoadMoreConfig(
  totalItems,
  { initialCount, step = DEFAULT_POST_FEED_STEP } = {}
) {
  if (!Number.isInteger(initialCount) || initialCount <= 0) {
    return null;
  }

  if (!Number.isInteger(totalItems) || totalItems <= initialCount) {
    return null;
  }

  return {
    initial: initialCount,
    step,
    buttonLabel: `Load ${step} more posts`,
  };
}

export function getHomePageFeedModel(posts) {
  const published = (posts || []).filter((post) => post?.published);
  const latestPosts = sortPostsByDateDesc(published);
  const featuredPost = sortPostsByPinnedThenDateDesc(published)[0] || null;

  return {
    featuredPost,
    latestPosts,
    loadMore: buildPostFeedLoadMoreConfig(latestPosts.length, {
      initialCount: HOME_INITIAL_POSTS,
      step: DEFAULT_POST_FEED_STEP,
    }),
  };
}

function stripHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entry]) => entry !== undefined && entry !== null && entry !== ''
    )
  );
}

export function getTopPosts(posts, currentPostName, limit = 4) {
  return (posts || [])
    .filter((post) => post?.published && post.name !== currentPostName)
    .sort(
      (left, right) =>
        Number(Boolean(right.pinned)) - Number(Boolean(left.pinned)) ||
        toTimestamp(right.date) - toTimestamp(left.date)
    )
    .slice(0, limit)
    .map((post) => ({
      title: post.title,
      date: post.date,
      url: `/posts/${post.name}.html`,
    }));
}

export function getTopTags(posts, limit = 6) {
  const counts = new Map();

  for (const post of posts || []) {
    if (!post?.published) continue;

    for (const tag of post.tags || []) {
      const key = tag.key || tag.slug || tag.label || tag.name || String(tag);
      const current = counts.get(key) || {
        key,
        slug: tag.slug || key,
        label: tag.label || tag.name || String(tag),
        url: `/tags/${key}.html`,
        count: 0,
      };

      current.count += 1;
      counts.set(key, current);
    }
  }

  return [...counts.values()]
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, limit);
}

function generatePosts(posts, config, renderer) {
  if (!posts || !Array.isArray(posts)) return;

  const { url } = getSiteMeta(config);
  const site = getSiteContext(config);

  // Filter published posts and sort by date
  const publishedPosts = posts
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const topTags = getTopTags(publishedPosts);

  for (let i = 0; i < publishedPosts.length; i++) {
    const post = publishedPosts[i];
    const ogImageUrl = getOgImageUrl(config, 'post', post.name);

    // Calculate next and previous posts
    const nextPost = i > 0 ? publishedPosts[i - 1] : null;
    const prevPost = i < publishedPosts.length - 1 ? publishedPosts[i + 1] : null;

    // Add navigation properties to post
    const postWithNav = {
      ...post,
      // Ensure post url is available for templates (share links, canonical, etc.)
      url: `/posts/${post.name}.html`,
      ogImageUrl,
      giscusTerm: post.source || `data/posts/${post.name}.md`,
      next: nextPost ? { title: nextPost.title, url: `/posts/${nextPost.name}.html` } : null,
      prev: prevPost ? { title: prevPost.title, url: `/posts/${prevPost.name}.html` } : null,
    };

    // Find related posts based on tags (simple algorithm)
    const relatedPosts = publishedPosts
      .filter((p) => p.name !== post.name) // Exclude current post
      .filter((p) => p.tags && post.tags && p.tags.some((tag) => post.tags.includes(tag))) // Same tags
      .slice(0, 3); // Take first 3
    const topPosts = getTopPosts(publishedPosts, post.name);

    // Use the proper post.html template
    try {
      const html = renderer.render('src/templates/post.html', {
        post: postWithNav,
        title: post.title,
        current: 'posts',
        canonicalUrl: joinUrl(url, `posts/${post.name}.html`),
        ogImageUrl,
        description: post.excerpt || post.description,
        relatedPosts: relatedPosts, // Always provide as array
        relatedSeries: [],
        topPosts,
        topTags,
        site,
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
  <script>
    if (location.protocol === 'file:') {
      document.documentElement.dataset.previewMode = 'file';
    }
  </script>
  <style>
    .file-preview-warning {
      display: none;
      margin: 0;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #d9a441;
      background: #fff3cd;
      color: #5c3b00;
      font: 600 0.95rem/1.4 "Avenir Next", "Segoe UI Variable Text", "Helvetica Neue", sans-serif;
    }
    html[data-preview-mode='file'] .file-preview-warning {
      display: block;
    }
    .file-preview-warning code {
      font: 700 0.92em/1.2 "SFMono-Regular", "SF Mono", "Consolas", "Liberation Mono", monospace;
    }
  </style>
  <link rel="stylesheet" href="/styles/index.css">
</head>
<body>
  <p class="file-preview-warning" role="alert">
    This page was opened from <code>file://</code>. Chromium blocks the local CSS and JS for this site in that mode.
    Preview it over HTTP with <code>pnpm dev</code> or <code>pnpm preview</code>.
  </p>
  <main>
    <article>
      <h1>{{ title }}</h1>
      <div>{{ content | raw }}</div>
    </article>
  </main>
</body>
</html>`;
      const html = renderer.renderString(tpl, { ...post, site });
      ensureDir(config.postsOutputDir);
      writeFileSync(join(config.postsOutputDir, `${post.name}.html`), html, 'utf8');
    }
  }
}

function generateTags(tags, config, renderer) {
  if (!tags || !Array.isArray(tags)) return;

  const site = getSiteContext(config);

  for (const tag of tags) {
    const tagForTpl = { ...tag, name: tag.label || tag.name, slug: tag.key || tag.slug };
    const { baseUrl, url, title } = getSiteMeta(config);
    const ogImageUrl = getOgImageUrl(config, 'tag', tagForTpl.slug);
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
      render: (ctx) => {
        const loadMore =
          ctx.page === 1
            ? buildPostFeedLoadMoreConfig(ctx.items.length, {
                initialCount: config.PAGE_SIZE || DEFAULT_POST_FEED_STEP,
                step: DEFAULT_POST_FEED_STEP,
              })
            : null;

        return renderer.render('src/templates/tag.html', {
          tag: tagForTpl,
          posts: loadMore ? ctx.items : ctx.itemsPage,
          title:
            ctx.page === 1
              ? `${tagForTpl.name} Posts`
              : `${tagForTpl.name} Posts — Page ${ctx.page}`,
          current: 'tags',
          canonicalUrl:
            ctx.page === 1
              ? joinUrl(url, `tags/${tagForTpl.slug}.html`)
              : joinUrl(url, `tags/${tagForTpl.slug}/${ctx.page}/`),
          ogImageUrl,
          feedUrl: joinUrl(url, `tags/${tagForTpl.slug}.xml`),
          description: `Posts tagged with ${tagForTpl.name}${ctx.page > 1 ? ` — Page ${ctx.page}` : ''}`,
          sortBy: 'date-desc',
          viewMode: 'list',
          pagination: loadMore ? null : ctx.pagination,
          loadMore,
          relatedTags: [],
          site,
        });
      },
    });

    // Feed
    const tagFeedXml = buildRssFeed({
      title: `${title} — ${tagForTpl.name}`,
      link: `${url}/tags/${tagForTpl.slug}/`,
      description: `RSS feed for posts tagged with ${tagForTpl.name}`,
      items,
      siteUrl: url,
      feedUrl: joinUrl(url, `tags/${tagForTpl.slug}.xml`),
      language: config.SITE_META?.language,
    });
    writeFileSync(feedPath, tagFeedXml, 'utf8');
  }
}

function generateMonths(months, config, renderer) {
  if (!months || !Array.isArray(months)) return;

  const site = getSiteContext(config);

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
    const ogImageUrl = getOgImageUrl(config, 'month', monthForTpl.slug);
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
      render: (ctx) => {
        const loadMore =
          ctx.page === 1
            ? buildPostFeedLoadMoreConfig(ctx.items.length, {
                initialCount: config.PAGE_SIZE || DEFAULT_POST_FEED_STEP,
                step: DEFAULT_POST_FEED_STEP,
              })
            : null;

        return renderer.render('src/templates/month.html', {
          month: monthForTpl,
          monthTags,
          posts: loadMore ? ctx.items : ctx.itemsPage,
          title: ctx.page === 1 ? `${monthForTpl.name}` : `${monthForTpl.name} — Page ${ctx.page}`,
          current: 'posts',
          canonicalUrl:
            ctx.page === 1
              ? joinUrl(url, `months/${monthForTpl.slug}.html`)
              : joinUrl(url, `months/${monthForTpl.slug}/${ctx.page}/`),
          ogImageUrl,
          feedUrl: joinUrl(url, `months/${monthForTpl.slug}.xml`),
          description: `Posts from ${monthForTpl.name}${ctx.page > 1 ? ` — Page ${ctx.page}` : ''}`,
          showStats: true,
          variant: 'month',
          pagination: loadMore ? null : ctx.pagination,
          loadMore,
          site,
        });
      },
    });

    // Feed
    const monthFeedXml = buildRssFeed({
      title: `${title} — ${monthForTpl.name}`,
      link: `${url}/months/${monthForTpl.slug}/`,
      description: `RSS feed for posts from ${monthForTpl.name}`,
      items,
      siteUrl: url,
      feedUrl: joinUrl(url, `months/${monthForTpl.slug}.xml`),
      language: config.SITE_META?.language,
    });
    writeFileSync(feedPath, monthFeedXml, 'utf8');
  }
}

function generateSeries(series, config, renderer) {
  if (!series || !Array.isArray(series)) return;

  const site = getSiteContext(config);

  for (const serie of series) {
    const { baseUrl, url } = getSiteMeta(config);
    const ogImageUrl = getOgImageUrl(config, 'series', serie.slug);
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
      render: (ctx) => {
        const loadMore =
          ctx.page === 1
            ? buildPostFeedLoadMoreConfig(ctx.items.length, {
                initialCount: config.PAGE_SIZE || DEFAULT_POST_FEED_STEP,
                step: DEFAULT_POST_FEED_STEP,
              })
            : null;

        return renderer.render('src/templates/series.html', {
          series: serie,
          posts: loadMore ? ctx.items : ctx.itemsPage,
          title: ctx.page === 1 ? `${serie.title}` : `${serie.title} — Page ${ctx.page}`,
          current: 'posts',
          canonicalUrl:
            ctx.page === 1
              ? joinUrl(url, `series/${serie.slug}.html`)
              : joinUrl(url, `series/${serie.slug}/${ctx.page}/`),
          ogImageUrl,
          description: serie.description,
          relatedSeries: [],
          variant: 'series',
          pagination: loadMore ? null : ctx.pagination,
          loadMore,
          site,
        });
      },
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

function getRssBuildDate(items) {
  const latestTimestamp = (items || []).reduce(
    (currentLatest, item) => Math.max(currentLatest, toTimestamp(item?.date)),
    0
  );

  return latestTimestamp > 0 ? new Date(latestTimestamp).toUTCString() : null;
}

export function buildRssFeed({ title, link, description, items, siteUrl, feedUrl, language }) {
  const safeTitle = escapeXml(title);
  const safeDesc = escapeXml(description);
  const feedItems = (items || [])
    .filter((p) => p && p.published !== false)
    .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date))
    .slice(0, 20);
  const lastBuildDate = getRssBuildDate(feedItems);
  const channelItems = feedItems
    .map((p) => {
      const itemTitle = escapeXml(p.title || p.name);
      const itemLink = `${siteUrl}/posts/${p.name}.html`;
      const guid = `${siteUrl}/posts/${p.name}.html`;
      const pubDate = toTimestamp(p.date) > 0 ? new Date(p.date).toUTCString() : null;
      const desc = escapeXml(p.excerpt || '');
      return (
        `    <item>\n` +
        `      <title>${itemTitle}</title>\n` +
        `      <link>${itemLink}</link>\n` +
        `      <guid isPermaLink="true">${guid}</guid>\n` +
        (pubDate ? `      <pubDate>${pubDate}</pubDate>\n` : '') +
        (desc ? `      <description>${desc}</description>\n` : '') +
        `    </item>`
      );
    })
    .join('\n');

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n` +
    `  <channel>\n` +
    `    <title>${safeTitle}</title>\n` +
    `    <link>${escapeXml(link)}</link>\n` +
    `    <description>${safeDesc}</description>\n` +
    (feedUrl
      ? `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />\n`
      : '') +
    (language ? `    <language>${escapeXml(language)}</language>\n` : '') +
    (lastBuildDate ? `    <lastBuildDate>${lastBuildDate}</lastBuildDate>\n` : '') +
    (channelItems ? `${channelItems}\n` : '') +
    `  </channel>\n` +
    `</rss>\n`;
  return xml;
}

export function buildJsonFeed({
  title,
  homePageUrl,
  feedUrl,
  description,
  items,
  siteUrl,
  author,
  language,
}) {
  const feedItems = (items || [])
    .filter((post) => post && post.published !== false)
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .slice(0, 20)
    .map((post) => {
      const itemUrl = `${siteUrl}/posts/${post.name}.html`;
      return compactObject({
        id: itemUrl,
        url: itemUrl,
        title: post.title || post.name,
        summary: post.excerpt || post.description || '',
        content_html: post.content || undefined,
        content_text: !post.content ? stripHtml(post.excerpt || post.description || '') : undefined,
        image: getOgImageUrl({ SITE_META: { url: siteUrl } }, 'post', post.name),
        date_published: post.date ? new Date(post.date).toISOString() : undefined,
        tags: (post.tags || [])
          .map((tag) => tag?.label || tag?.name || tag?.key || tag?.slug || String(tag))
          .filter(Boolean),
      });
    });

  const feed = compactObject({
    version: 'https://jsonfeed.org/version/1.1',
    title,
    home_page_url: homePageUrl,
    feed_url: feedUrl,
    description,
    language,
    authors: author ? [compactObject({ name: author, url: siteUrl })] : undefined,
    items: feedItems,
  });

  return `${JSON.stringify(feed, null, 2)}\n`;
}

export function buildSitemap({ dataset, siteUrl }) {
  const staticPages = ['/', '/about.html', '/archive.html', '/privacy.html', '/playground.html'];
  const postPages = (dataset.posts || [])
    .filter((post) => post?.published)
    .map((post) => `/posts/${post.name}.html`);
  const tagPages = (dataset.tags || []).map((tag) => `/tags/${tag.slug || tag.key}.html`);
  const monthPages = (dataset.months || []).map(
    (month) => `/months/${month.slug || month.key}.html`
  );
  const seriesPages = (dataset.series || []).map((entry) => `/series/${entry.slug}.html`);

  const urls = [
    ...new Set([...staticPages, ...postPages, ...tagPages, ...monthPages, ...seriesPages]),
  ];
  const body = urls
    .map(
      (pathname) =>
        `  <url>\n    <loc>${escapeXml(`${siteUrl}${pathname}`)}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`
    )
    .join('\n');

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${body}\n` +
    `</urlset>\n`
  );
}

// M7: generate static site pages
function generateStaticPages(dataset, config, renderer) {
  const { url } = getSiteMeta(config);
  const site = getSiteContext(config);

  // Home: latest posts by publication date, with a separate featured selection
  try {
    const { featuredPost, latestPosts, loadMore } = getHomePageFeedModel(dataset.posts || []);
    const topTags = (dataset.tags || [])
      .slice()
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 6);
    const html = renderer.render('src/templates/home.html', {
      title: config.SITE_META?.title || 'dout.dev',
      description:
        'Field notes on CSS, accessibility, design systems, and the mechanics of publishing a fast static site without the usual framework gloss.',
      canonicalUrl: joinUrl(url, '/'),
      ogImageUrl: getOgImageUrl(config, 'page', 'home'),
      feedUrl: joinUrl(url, getGlobalRssFeedPath(config)),
      jsonFeedUrl: joinUrl(url, getGlobalJsonFeedPath(config)),
      posts: latestPosts,
      featuredPost,
      loadMore,
      topTags,
      stats: {
        posts: latestPosts.length,
        tags: dataset.tags?.length || 0,
        series: dataset.series?.length || 0,
      },
      site,
    });
    ensureDir('src');
    writeFileSync(join('src', 'index.html'), html, 'utf8');
  } catch (e) {
    console.warn('Warning: failed to generate home page:', e?.message || e);
  }

  // Search
  try {
    const html = renderer.render('src/templates/search.html', {
      title: 'Search',
      description: 'Search posts, tags, months, and series on dout.dev.',
      canonicalUrl: joinUrl(url, 'search.html'),
      ogImageUrl: getOgImageUrl(config, 'page', 'search'),
      robots: 'noindex,follow',
      site,
    });
    writeFileSync(join('src', 'search.html'), html, 'utf8');
  } catch (e) {
    console.warn('Warning: failed to generate search page:', e?.message || e);
  }

  // Archive
  try {
    const months = (dataset.months || [])
      .slice()
      .sort((a, b) => String(b.key).localeCompare(String(a.key)));
    const tags = (dataset.tags || []).slice().sort((a, b) => (b.count || 0) - (a.count || 0));
    const series = (dataset.series || []).slice().sort((a, b) => (b.count || 0) - (a.count || 0));
    const html = renderer.render('src/templates/archive.html', {
      title: 'Archive',
      description: 'Browse the complete dout.dev archive by month, topic, and series.',
      canonicalUrl: joinUrl(url, 'archive.html'),
      ogImageUrl: getOgImageUrl(config, 'page', 'archive'),
      months,
      tags,
      series,
      site,
    });
    writeFileSync(join('src', 'archive.html'), html, 'utf8');
  } catch (e) {
    console.warn('Warning: failed to generate archive page:', e?.message || e);
  }

  // About
  try {
    const html = renderer.render('src/templates/about.html', {
      title: 'About',
      description: 'About dout.dev and the editorial system behind it.',
      canonicalUrl: joinUrl(url, 'about.html'),
      ogImageUrl: getOgImageUrl(config, 'page', 'about'),
      site,
    });
    writeFileSync(join('src', 'about.html'), html, 'utf8');
  } catch (e) {
    console.warn('Warning: failed to generate about page:', e?.message || e);
  }

  // Privacy
  try {
    const html = renderer.render('src/templates/privacy.html', {
      title: 'Privacy',
      description: 'Privacy notes, local page-hit analytics, and opt-out controls for dout.dev.',
      canonicalUrl: joinUrl(url, 'privacy.html'),
      ogImageUrl: getOgImageUrl(config, 'page', 'privacy'),
      site,
    });
    writeFileSync(join('src', 'privacy.html'), html, 'utf8');
  } catch (e) {
    console.warn('Warning: failed to generate privacy page:', e?.message || e);
  }

  // Playground
  try {
    const html = renderer.render('src/templates/playground.html', {
      title: 'Playground',
      canonicalUrl: joinUrl(url, 'playground.html'),
      description: 'Experiments, prototypes, and interface sketches from dout.dev.',
      ogImageUrl: getOgImageUrl(config, 'page', 'playground'),
      site,
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
      description: 'The requested page could not be found on dout.dev.',
      ogImageUrl: getOgImageUrl(config, 'page', '404'),
      robots: 'noindex,follow',
      site,
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
      description: 'Offline fallback page for dout.dev.',
      ogImageUrl: getOgImageUrl(config, 'page', 'offline'),
      robots: 'noindex,follow',
      site,
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
      ariaLabel: p === page ? `Page ${p}, current page` : `Go to page ${p}`,
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
    navLabel: 'Pagination',
    firstHref: baseHtmlHref,
    lastHref: pageCount > 1 ? `${baseFolderHref}${pageCount}/` : baseHtmlHref,
    firstLabel: 'Go to first page',
    lastLabel: `Go to last page${pageCount > 1 ? `, page ${pageCount}` : ''}`,
    prevHref: prev ? (prev === 1 ? baseHtmlHref : `${baseFolderHref}${prev}/`) : null,
    prevLabel: prev ? `Go to previous page${prev ? `, page ${prev}` : ''}` : '',
    nextHref: next ? `${baseFolderHref}${next}/` : null,
    nextLabel: next ? `Go to next page, page ${next}` : '',
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
      const html = render({
        page,
        pageCount,
        items: sorted,
        itemsPage,
        pagination,
        canonicalUrl,
      });
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
