#!/usr/bin/env node
// CMS Build - orchestrates scan and page generation
import { scanContent } from './scan.js';
import { buildOgImages } from './og-image-generator.js';
import { generatePages, buildJsonFeed, buildRssFeed, buildSitemap } from './page-generator.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { resolveConfig } from './config.js';

const YES_ANSWERS = new Set(['y', 'yes']);

/**
 * Returns draft posts that are due to be published.
 * @param {Array<object>} posts
 * @param {Date} now
 * @returns {Array<object>}
 */
export function findEligibleScheduledDrafts(posts, now = new Date()) {
  const currentDate = now instanceof Date ? now : new Date(now);

  return (posts || [])
    .filter((post) => {
      if (!post || post.published !== false || !post.date || !post.source) {
        return false;
      }

      const scheduledDate = new Date(post.date);
      return (
        !Number.isNaN(scheduledDate.getTime()) && scheduledDate.getTime() <= currentDate.getTime()
      );
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Updates the first `published: false` occurrence in a markdown front matter block.
 * @param {string} raw
 * @returns {{ changed: boolean, content: string }}
 */
export function updatePublishedFrontMatter(raw) {
  const frontMatterPattern = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/;
  const match = raw.match(frontMatterPattern);

  if (!match) {
    return { changed: false, content: raw };
  }

  const [, openingFence, frontMatter, closingFence] = match;
  const updatedFrontMatter = frontMatter.replace(
    /(^|\r?\n)([ \t]*published[ \t]*:[ \t]*)false([ \t]*(?:#.*)?)(?=\r?\n|$)/i,
    '$1$2true$3'
  );

  if (updatedFrontMatter === frontMatter) {
    return { changed: false, content: raw };
  }

  return {
    changed: true,
    content: raw.replace(frontMatterPattern, `${openingFence}${updatedFrontMatter}${closingFence}`),
  };
}

function canPromptForDrafts({ interactive = true, confirm } = {}) {
  if (typeof confirm === 'function') {
    return true;
  }

  return interactive && Boolean(process.stdin?.isTTY) && Boolean(process.stdout?.isTTY);
}

function shouldPublishDraft(answer) {
  if (typeof answer === 'boolean') {
    return answer;
  }

  const normalized = String(answer ?? '')
    .trim()
    .toLowerCase();
  return YES_ANSWERS.has(normalized);
}

async function askToPublishDraft(post, { confirm, prompt }) {
  if (typeof confirm === 'function') {
    return shouldPublishDraft(await confirm(post));
  }

  return shouldPublishDraft(await prompt(post));
}

/**
 * Prompts the user to publish scheduled drafts and updates front matter on disk.
 * @param {Array<object>} posts
 * @param {object} options
 * @returns {Promise<{ changed: Array<object>, skipped: Array<object> }>}
 */
export async function maybePublishScheduledDrafts(posts, options = {}) {
  const {
    now = new Date(),
    interactive = true,
    confirm,
    logger = console,
    readFileImpl = readFile,
    writeFileImpl = writeFile,
  } = options;

  const eligibleDrafts = findEligibleScheduledDrafts(posts, now);

  if (eligibleDrafts.length === 0) {
    return { changed: [], skipped: [] };
  }

  if (!canPromptForDrafts({ interactive, confirm })) {
    logger.log?.(
      `Skipping ${eligibleDrafts.length} scheduled draft(s) because the build is running without an interactive terminal.`
    );
    return { changed: [], skipped: eligibleDrafts };
  }

  const changed = [];
  const skipped = [];
  let promptInterface = null;

  const prompt = async (post) => {
    if (!promptInterface) {
      promptInterface = createInterface({ input: process.stdin, output: process.stdout });
    }

    const scheduledDateLabel = post.date
      ? new Date(post.date).toISOString().slice(0, 10)
      : 'unknown';
    return promptInterface.question(
      `\nDraft scheduled for publication:\n- Title: ${post.title || post.name}\n- Date: ${scheduledDateLabel}\n- Source: ${post.source}\nChange published to true and include it in this build? [y/N] `
    );
  };

  try {
    for (const post of eligibleDrafts) {
      const approved = await askToPublishDraft(post, { confirm, prompt });

      if (!approved) {
        skipped.push(post);
        continue;
      }

      const sourcePath = join(process.cwd(), post.source);
      const raw = await readFileImpl(sourcePath, 'utf8');
      const updated = updatePublishedFrontMatter(raw);

      if (!updated.changed) {
        logger.warn?.(`Unable to update published flag for ${post.source}; leaving it as a draft.`);
        skipped.push(post);
        continue;
      }

      await writeFileImpl(sourcePath, updated.content, 'utf8');
      changed.push(post);
      logger.log?.(`Published and queued for build: ${post.title || post.name}`);
    }
  } finally {
    promptInterface?.close();
  }

  return { changed, skipped };
}

export async function build(userConfig = {}, runtimeOptions = {}) {
  const config = resolveConfig(userConfig);
  const initialDataset = scanContent(config);
  const draftResolution = await maybePublishScheduledDrafts(initialDataset.posts, runtimeOptions);
  const dataset = draftResolution.changed.length > 0 ? scanContent(config) : initialDataset;

  if (draftResolution.changed.length > 0) {
    console.log(`Re-scanned content after publishing ${draftResolution.changed.length} draft(s).`);
  }

  await buildOgImages({ dataset, config });
  generatePages(dataset, config);
  // Emit searchable JSON indexes under src/data for client-side features (e.g., M10 Search)
  try {
    const outDir = join('src', 'data');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'posts.json'), JSON.stringify(dataset.posts, null, 2), 'utf8');
    writeFileSync(join(outDir, 'tags.json'), JSON.stringify(dataset.tags, null, 2), 'utf8');
    writeFileSync(join(outDir, 'months.json'), JSON.stringify(dataset.months, null, 2), 'utf8');
    writeFileSync(join(outDir, 'series.json'), JSON.stringify(dataset.series, null, 2), 'utf8');
  } catch (e) {
    console.warn('Warning: failed to write search indexes to src/data', e?.message || e);
  }
  // Generate global site RSS feed (latest posts)
  try {
    const posts = (dataset.posts || [])
      .filter((p) => p.published)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const rssPath = config.SITE_META.rssFeedPath || '/feed.rss';
    const jsonFeedPath = config.SITE_META.jsonFeedPath || '/feed.json';
    const legacyRssFeedPath = config.SITE_META.legacyRssFeedPath || '/feed.xml';
    const xml = buildRssFeed({
      title: `${config.SITE_META.title} — Latest Posts`,
      link: `${config.SITE_META.url}/`,
      description: config.SITE_META.description,
      items: posts,
      siteUrl: config.SITE_META.url,
      feedUrl: `${config.SITE_META.url}${rssPath}`,
      language: config.SITE_META.language,
    });
    const json = buildJsonFeed({
      title: `${config.SITE_META.title} — Latest Posts`,
      homePageUrl: `${config.SITE_META.url}/`,
      feedUrl: `${config.SITE_META.url}${jsonFeedPath}`,
      description: config.SITE_META.description,
      items: posts,
      siteUrl: config.SITE_META.url,
      author: config.SITE_META.author,
      language: config.SITE_META.language,
    });
    writeFileSync(join('src', rssPath.replace(/^\//, '')), xml, 'utf8');
    writeFileSync(join('src', legacyRssFeedPath.replace(/^\//, '')), xml, 'utf8');
    writeFileSync(join('src', jsonFeedPath.replace(/^\//, '')), json, 'utf8');
  } catch (e) {
    console.warn('Warning: failed to generate global feeds', e?.message || e);
  }
  try {
    const sitemap = buildSitemap({ dataset, siteUrl: config.SITE_META.url });
    writeFileSync(join('src', 'sitemap.xml'), sitemap, 'utf8');
  } catch (e) {
    console.warn('Warning: failed to generate sitemap.xml', e?.message || e);
  }
  return dataset;
}

export async function main() {
  try {
    const dataset = await build();
    console.log(
      `Built ${dataset.posts.length} posts, ${dataset.tags.length} tags, ${dataset.months.length} months, ${dataset.series.length} series`
    );
    process.exit(0);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
