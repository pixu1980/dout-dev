# Markdown-as-CMS Audit for dout.dev

## Scope

This report checks the concerns raised in the OpenReplay article against dout.dev's current implementation. It focuses on the actual code path in the custom CMS and template engine, plus the CI workflow where that affects authoring and preview.

Status legend:

- Bypassed: the repo has a concrete implementation that removes most of the limitation for this project.
- Partially bypassed: the repo covers part of the problem, but with narrow scope or important caveats.
- Not bypassed: the limitation still exists in practice, or the repo deliberately does not address it.

## 1. Structured querying and content relationships

Status: Partially bypassed

Evidence:

- [scripts/cms/scan.js](../../scripts/cms/scan.js) builds derived datasets for posts, tags, months, and series from Markdown source.
- [scripts/cms/page-generator.js](../../scripts/cms/page-generator.js) turns those datasets into tag, month, and series pages and computes post-to-post navigation.
- [README.md](../../README.md) documents static search datasets and archive output.

What this means:

dout.dev bypasses the "plain files have no structure" problem for blog-shaped relationships. Tags, months, series, feeds, search datasets, and next/previous navigation are all generated at build time.

What it does not mean:

This is still a precomputed static model. There is no general query language, no arbitrary relation engine, and no database-like filtering layer for complex domains.

One caveat is worth calling out: [scripts/cms/page-generator.js](../../scripts/cms/page-generator.js) currently computes related posts with `post.tags.includes(tag)`, which compares tag objects by reference rather than by key. Archive relationships are real; the "related posts" heuristic is weaker than it looks.

## 2. Editorial workflow, drafts, and preview

Status: Partially bypassed

Evidence:

- [scripts/cms/post-processor.js](../../scripts/cms/post-processor.js) supports draft exclusion through `published: false`.
- [scripts/cms/watch.js](../../scripts/cms/watch.js) provides local rebuild-on-save for author preview.
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml) uploads a PR preview artifact with the built `dist/` directory.
- [data/posts/2026-09-08-github-pages-deploy-previews.md](../../data/posts/2026-09-08-github-pages-deploy-previews.md) documents the preview model.

What this means:

For a Git-native workflow, dout.dev has a workable draft and preview story.

What it does not mean:

There is no approval chain, no role-based permissions, no editorial UI, and no live staging environment inside the CMS itself. `scheduledAt` is documented in [docs/technical-specs.md](../../docs/technical-specs.md), but the current processing code does not implement scheduled publishing.

## 3. Localization

Status: Not bypassed

Evidence:

- [scripts/cms/config.js](../../scripts/cms/config.js) configures a single site language and locale.
- [docs/roadmap.md](../../docs/roadmap.md) explicitly defines the project as English-only.
- [scripts/template-engine/_filters.js](../../scripts/template-engine/_filters.js) exposes locale-aware date formatting, but only as a formatting helper.

What this means:

dout.dev can format dates with a locale, but that is not the same as multilingual content support.

What it does not mean:

There are no translated content models, no locale routing, no hreflang generation from source content, and no workflow for parallel language versions. The filter layer even still defaults some date formatting to `it-IT`, which reinforces that locale handling exists as an implementation detail rather than a coherent i18n system.

## 4. Media management

Status: Bypassed for a static editorial site

Evidence:

- [scripts/cms/marked-syntax.js](../../scripts/cms/marked-syntax.js) turns Markdown images into responsive `<picture>` output with srcset, lazy loading, and `<noscript>` fallback.
- [scripts/cms/post-processor.js](../../scripts/cms/post-processor.js) extracts cover image dimensions and normalizes alt and title data.
- [README.md](../../README.md) documents the responsive image manifest and authoring syntax.
- [scripts/cms/og-image-generator.js](../../scripts/cms/og-image-generator.js) generates OG images at build time.

What this means:

The repo clearly bypasses one of the most common Markdown pain points: raw image handling. For this kind of site, media tooling is strong.

What it does not mean:

This is still build-time asset processing, not a full DAM or headless media platform. Upload workflow, CDN policy, and cross-team asset governance remain outside the system.

## 5. Non-technical editor friendliness

Status: Not bypassed

Evidence:

- Content lives in [data/posts](../../data/posts).
- The normal workflow in [README.md](../../README.md) is file editing, Git, and local preview commands.
- No admin UI, visual editor, or Git abstraction exists in the repo.

What this means:

The workflow is optimized for a developer author.

What it does not mean:

A non-technical editorial team could not adopt this comfortably without another layer on top.

## 6. Markdown flavor consistency and parser ambiguity

Status: Bypassed

Evidence:

- [scripts/cms/post-processor.js](../../scripts/cms/post-processor.js) routes all Markdown through one pipeline.
- [scripts/cms/marked-syntax.js](../../scripts/cms/marked-syntax.js) defines the renderer behavior for code blocks, headings, task lists, and images.
- [scripts/cms/html-sanitizer.js](../../scripts/cms/html-sanitizer.js) sanitizes the resulting HTML.

What this means:

dout.dev does not depend on "whatever Markdown flavor the current tool happens to use." It has one parser, one renderer configuration, and one sanitizer.

What it does not mean:

The supported syntax is whatever this pipeline implements. That is good for consistency, but it is narrower than an ecosystem with MDX plugins or rich editor extensions.

## 7. Dynamic content and real-time updates

Status: Not bypassed

Evidence:

- [scripts/cms/scan.js](../../scripts/cms/scan.js) and [scripts/cms/page-generator.js](../../scripts/cms/page-generator.js) generate static outputs at build time.
- [scripts/cms/config.js](../../scripts/cms/config.js) supports Giscus and analytics, but those are external runtime integrations.

What this means:

The site can consume some runtime services around the edges.

What it does not mean:

Core content still requires rebuild and redeploy. There is no live data model, no user-generated content pipeline, and no real-time publishing.

## 8. MDX and embedded components

Status: Not bypassed by design

Evidence:

- [scripts/cms/post-processor.js](../../scripts/cms/post-processor.js) uses `marked`, not an MDX compiler.
- [scripts/template-engine/index.js](../../scripts/template-engine/index.js) exposes an HTML-native template engine for page rendering, not JSX-in-Markdown.
- Repo search shows no MDX dependencies or MDX authoring flow.

What this means:

dout.dev keeps Markdown portable and keeps layout logic in templates.

What it does not mean:

Authors cannot embed framework components inside content files the way they would in MDX. This is a deliberate trade-off, not a missing dependency.

## 9. Version control, portability, and simplicity

Status: Bypassed

Evidence:

- [README.md](../../README.md) defines the project as vanilla-first with zero runtime dependencies.
- [docs/technical-specs.md](../../docs/technical-specs.md) defines a fully static, portable artifact.
- Content remains plaintext Markdown plus front matter in Git.

What this means:

This is where dout.dev is strongest. Content is portable, reviewable, diff-friendly, and deployable to any static host.

What it does not mean:

Simplicity here is tied to project scope. The system stays simple because the content model is intentionally narrow.

## Bottom line

dout.dev does bypass several of the real problems that people attribute to Markdown:

- parser inconsistency;
- media handling for a static editorial site;
- blog-level relationships such as tags, months, series, and search datasets;
- Git-native versioning and portable output.

It only partially bypasses:

- preview and draft workflow;
- structured relationships beyond blog taxonomies.

It does not bypass:

- non-technical editing;
- approvals and permissions;
- localization;
- dynamic or real-time content;
- MDX-style embedded components.

That makes the system a strong fit for a developer-owned blog and a weak fit for a multi-author, workflow-heavy content operation.

## Source

- [OpenReplay Team, "The Good And Bad Of Using Markdown As A CMS"](https://blog.openreplay.com/markdown-cms-pros-cons/)
