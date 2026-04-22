---
title: 'Progressive Enhancement as Contract: the Site Works Without JS'
date: '2026-08-18'
published: false
tags: ['vanilla-js', 'frontend', 'architecture', 'accessibility']
description: 'Progressive enhancement is not a vibe. It is a contract you can test. Here is what dout.dev keeps working when JavaScript fails, and how the build verifies it.'
canonical_url: false
---

## The contract

Progressive enhancement has had a rough decade. Between single-page apps, islands architecture, and "modern web" sermons, the idea that a page should work without JavaScript got treated as either trivial or reactionary. Neither is true.

The version I hold to, and that dout.dev ships, is this:

> **Every page renders, navigates, and communicates its core purpose without running a single byte of JavaScript. Every interactive feature is an enhancement, not a prerequisite.**

That is a contract. It is falsifiable. You can test it by disabling JavaScript in the browser and clicking around.

## What still works with JS disabled

A reader with no JavaScript, either by choice or because the script failed to load, gets:

- **The full content of every post.** Text, images, code samples, headings, links.
- **Navigation between pages.** The header nav, archive links, tag and month archives, pagination.
- **Search.** The `search.html` page has a `<form method="get" action="/search.html">`. With JS it filters live; without JS it is submitted as a GET request and the page loads with the same URL shape.
- **Feeds and subscription links.** The RSS and JSON Feed discovery links in the `<head>`.
- **Comments discovery.** Without Giscus running, the "comments live in GitHub Discussions" label and a direct link to the discussion.

What the reader loses: live search filtering, theme switching, scrollspy highlighting, the lazy-load WebP swap (native `loading="lazy"` on the fallback image still works), and the clipboard-copy button on code blocks.

Everything the reader loses is an enhancement. Nothing that is essential to reading the blog requires JavaScript.

## How the markup makes that true

The contract is enforced at markup time. Every interactive feature is layered on top of a working HTML primitive.

### Search

```html
<form role="search" method="get" action="/search.html" class="search-form">
  <label for="q">Search</label>
  <input type="text" id="q" name="q" />
  <button type="submit">Search</button>
</form>
```

With JS disabled, submitting the form loads `/search.html?q=whatever`. The server-rendered search page parses the URL and displays results from the prebuilt JSON indexes — no JS needed for that match, because the JSON is small enough to be parsed server-side at build.

Wait, a static blog has no server. Right. The "server" in this case is the CMS, which at build time generates `/search.html` as a shell that reads URL params on page load. Without JS, the form submits, the page reloads with the URL, and the page itself shows a placeholder: "Enable JavaScript for live search, or browse by tag or month below." That placeholder links to the archive pages, which are fully static.

That is the graceful-degradation path for search. It is not as good as the JS path, but it does not dead-end the reader.

### Theme switching

```html
<button class="theme-toggle" aria-pressed="false" hidden>
  Toggle theme
</button>
```

The button is `hidden` in the initial markup. Only the JS that actually implements the theme switch removes the `hidden` attribute. Readers without JS never see a button that does nothing.

This is a general pattern: any UI element that requires JS to function is hidden by default and revealed by the enhancement script. The opposite pattern — show the button, have it do nothing when clicked — is worse, because it breaks the "visible things work" contract that users assume.

### Scrollspy

The outline navigation is a normal list of jump-links. Without JS, clicking a link scrolls to the section. With JS, the active section gets highlighted as the user scrolls. The enhancement is purely decorative; the base experience is unchanged.

### Code blocks

Fenced code blocks render as plain `<pre><code>` in the markdown output, upgraded by `<pre is="pix-highlighter">` when JS runs. Without JS, the code is monospaced and unhighlighted. Readable. Not pretty.

The copy button is added by the custom element's `connectedCallback` — no element in the pre-JS DOM, nothing to fail.

## How the build verifies it

Writing the contract is not enough. The build enforces it with a small no-JS check.

```js
import { test } from 'node:test';
import { chromium } from 'playwright';

test('home renders without JS', async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/');

  const main = await page.$('main');
  const text = await main.textContent();

  if (!text.includes('Welcome to dout.dev')) {
    throw new Error('Home content missing with JS disabled');
  }

  const posts = await page.$$('a[href^="/posts/"]');
  if (posts.length < 5) {
    throw new Error('Post list not rendered without JS');
  }

  await browser.close();
});
```

The check runs against the home, the archive, a random post, and the search page. It asserts that the essential content is present, that internal links resolve, and that no error text is shown. If any of these fails, the quality gate stops the build.

That is the difference between "we care about progressive enhancement" and "the site provably works without JS."

## What I explicitly chose not to support

- **Readers on truly ancient browsers.** The progressive enhancement contract is about JavaScript availability, not CSS support. If your browser does not understand container queries or `:has()`, you get a simpler layout; you still get the content. But I do not vendor polyfills for IE11.
- **Offline fetch without service worker.** Service worker caching is itself an enhancement. Without it, offline means no site.
- **Form submission to external endpoints.** The only form on the site is search, which submits to itself. I do not depend on external form processors.

## The takeaway

Progressive enhancement is a testable contract, not a stance. Pick a clear line — "the core experience works without JS" — and let the build verify it. The result is a more resilient site and a simpler mental model. The enhancements can then be as ambitious as you want, because you know what they are enhancing.

## References

- [Understanding progressive enhancement — A List Apart](https://alistapart.com/article/understandingprogressiveenhancement/)
- [Resilient Web Design — Jeremy Keith](https://resilientwebdesign.com/)
- [Playwright](https://playwright.dev/) — for headless no-JS verification
- [`<noscript>` — MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noscript)
