---
title: 'Progressive Enhancement as Contract (Yes, It Works Without JS. No, I''m Not Kidding.)'
date: '2026-04-28'
author: 'Emiliano "pixu1980" Pisu'
author_link: "https://pixu.dev"
published: true
tags: ['making-of', 'progressive-enhancement', 'accessibility', 'vanilla-js']
series: 'How I made it'
description: 'What dout.dev keeps working when JavaScript fails, and how the markup and build checks make that promise testable. Spoiler: everything.'
canonical_url: false
---

## The contract (read this part)

Progressive enhancement has had a rough decade. Between single-page apps, islands architecture, and "modern web" sermons, the idea that a page should work without JavaScript got treated as either trivial or reactionary. Neither is true. It's engineering.

The version I hold to, and that dout.dev ships, is this:

> **Every page renders, navigates, and communicates its core purpose without running a single byte of JavaScript. Every interactive feature is an enhancement, not a prerequisite.**

**That is a contract. It is falsifiable.** You can test it right now by disabling JavaScript in your browser and clicking around. Go ahead. I'll wait.

## What still works with JS disabled (spoiler: basically everything)

A reader with no JavaScript, either by choice or because the script failed to load (hello, ad blocker with a heavy hand), gets:

- **The full content of every post.** Text, images, code samples, headings, links. All of it.
- **Navigation between pages.** The header nav, archive links, tag and month archives, pagination. Every link works.
- **Search.** The `search.html` page has a `<form method="get" action="/search.html">`. With JS it filters live; without JS it submits as a GET request and the page loads with the same URL. Graceful degradation, not graceful "you're fucked."
- **Feeds and subscription links.** The RSS and JSON Feed discovery links in the `<head>`. Alive and well.
- **Comments discovery.** Without Giscus running, the "comments live in GitHub Discussions" label and a direct link to the discussion. No dead end.

What the reader LOSES: live search filtering, theme switching, scrollspy highlighting, the lazy-load WebP swap (native `loading="lazy"` on the fallback image still works, by the way), and the clipboard-copy button on code blocks.

Everything the reader loses is an ENHANCEMENT. Nothing that is essential to reading the blog requires JavaScript. Nothing. Not one byte.

## How the markup makes that true (the engineering part)

The contract is enforced at markup time. Every interactive feature is layered on top of a working HTML primitive. It's like a cake: the base is good on its own, the frosting is just bonus.

### Search

```html
<form role="search" method="get" action="/search.html" data-search-form>
  <label for="q">Search</label>
  <input type="text" id="q" name="q" />
  <button type="submit">Search</button>
</form>
```

With JS disabled, submitting the form loads `/search.html?q=whatever`. Without JS, the form submits, the page reloads with the URL, and the page itself shows a placeholder: "Enable JavaScript for live search, or browse by tag or month below." That placeholder links to the archive pages, which are fully static.

That's the graceful-degradation path for search. It's not as good as the JS path, but it does NOT dead-end the reader.

### Theme switching

```html
<button data-theme-toggle aria-pressed="false" hidden>Toggle theme</button>
```

The button is `hidden` in the initial markup. Only the JS that actually implements the theme switch removes the `hidden` attribute. Readers without JS never see a button that does nothing.

This is a general pattern: any UI element that requires JS to function is HIDDEN BY DEFAULT and revealed by the enhancement script. The opposite pattern - show the button, have it do nothing when clicked - is worse, because it breaks the "visible things work" contract that users assume.

### Code blocks

Fenced code blocks render as plain `<pre><code>` in the markdown output, upgraded by `<pre is="pix-highlighter">` when JS runs. Without JS, the code is monospaced and unhighlighted. Readable. Not pretty. Functional.

The copy button is added by the custom element's `connectedCallback` - no element in the pre-JS DOM, nothing to fail.

## How the build verifies it (because trust is not a strategy)

Writing the contract is not enough. The build enforces it with a small no-JS check. And I mean literally enforces - it blocks the deploy if it fails.

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

The check runs against the home, the archive, a random post, and the search page. It asserts that the essential content is present, that internal links resolve, and that no error text is shown. If any of these fails, the quality gate stops the build. No deploy, no excuses.

That is the difference between "we care about progressive enhancement" and "the site provably works without JS." One is marketing. The other is engineering.

## What I explicitly chose not to support (because every choice has a cost)

- **Readers on truly ancient browsers.** The progressive enhancement contract is about JavaScript availability, not CSS support. If your browser does not understand container queries or `:has()`, you get a simpler layout; you still get the content. But I do NOT vendor polyfills for IE11. That bridge has been burned.
- **Offline fetch without service worker.** Service worker caching is itself an enhancement. Without it, offline means no site.
- **Form submission to external endpoints.** The only form on the site is search, which submits to itself. I do not depend on external form processors.

## The takeaway (the part where I sound like a fortune cookie)

Progressive enhancement is a testable contract, not a stance. Pick a clear line - "the core experience works without JS" - and let the build verify it. The result is a more resilient site and a simpler mental model. The enhancements can then be as ambitious as you want, because you know what they are enhancing.

Your users with shitty internet connections will thank you. The ones with screen readers will thank you. The ones using Lynx will silently judge everyone else.
