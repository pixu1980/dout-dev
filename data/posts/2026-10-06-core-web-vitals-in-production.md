---
title: 'Core Web Vitals in Production: LCP, CLS, INP on a Static Blog'
date: '2026-10-06'
published: false
tags: ['performance', 'seo', 'vanilla-js']
description: 'How dout.dev measures and defends the three Core Web Vitals in production, what the numbers look like, and the specific engineering choices that made them achievable.'
canonical_url: false
---

## The three numbers that matter

Core Web Vitals are not a complete performance model. They are three numbers Google decided matter for user experience, and they correlate strongly with perceived quality. For a content site, the three are:

- **LCP (Largest Contentful Paint)** — how long until the main element of the page appears. Target: under 2.5s.
- **CLS (Cumulative Layout Shift)** — how much the layout jumps during load. Target: under 0.1.
- **INP (Interaction to Next Paint)** — how responsive the page feels on click or keystroke. Target: under 200ms.

On dout.dev the live numbers are well under target on desktop and comfortably under on mobile. This post is what made that achievable, with the specific choices that matter.

## LCP: the image, the font, and the handful of milliseconds that add up

For a blog, the LCP element is almost always the post cover image or the first heading. Two decisions dominate.

**The cover image is eager and high-priority.**

```html
<img src="/assets/images/cover.jpg"
     alt="…"
     width="1200" height="630"
     loading="eager"
     fetchpriority="high"
     decoding="async" />
```

Default `loading="lazy"` on the LCP image delays the one number that most affects the score. `fetchpriority="high"` moves the image up in the network queue. Both are opt-in changes from the default behavior, and both are measurable.

**The font that renders the LCP text is preloaded.**

```html
<link rel="preload" as="font" type="font/woff2"
      href="/assets/fonts/Inter-Bold.woff2" crossorigin />
```

Without preload, the font is discovered when the CSS parses the `@font-face` rule, which is at least one round trip later. Preloading the weight used in the LCP heading saves a round trip and prevents the "invisible text" flash while the font arrives.

**No render-blocking third-party resources above the fold.** No Google Fonts link, no analytics script in the head, no "quick chat widget" that loads before the page. Every third-party script on dout.dev loads after the main content, or not at all on the critical path.

## CLS: known dimensions, everywhere

Layout shift is mostly a function of elements arriving after layout is computed. Four rules cover 95% of it.

**Every image has `width` and `height`.** The post generator reads the image manifest and emits the attributes. The browser reserves the box at the correct aspect ratio before the pixels arrive.

**Web fonts do not shift layout.** `font-display: swap` uses a fallback while the web font loads, and the fallback is chosen to have similar metrics. The metric pair I use for Inter is `Arial` with `size-adjust` and `ascent-override` tuned:

```css
@font-face {
  font-family: 'Inter Fallback';
  src: local('Arial');
  size-adjust: 107%;
  ascent-override: 90%;
}

body {
  font-family: 'Inter', 'Inter Fallback', sans-serif;
}
```

When Inter loads, the text does not visibly shift because the fallback is already sized to match. This is a handful of CSS lines that prevent an entire class of "text jumped when font arrived" bugs.

**Embedded iframes have reserved space.** The Giscus comments shell has a minimum height before the iframe loads. When the iframe arrives and reports its real height, the shell expands downward, which does not affect layout above it.

**Dynamically injected content pushes nothing.** The one place that loads content dynamically on dout.dev is the comments. Because they are at the bottom of the page, they cannot shift layout above them.

## INP: small main thread, no blocking handlers

INP replaced FID as the responsiveness metric because FID only measured the first interaction. INP measures every interaction and reports the 75th percentile.

Three decisions keep it low.

**The main thread is small.** Total JavaScript on a post page is under 10KB gzipped. No framework runtime, no hydration, no dev-mode analytics agent. The JS that runs is the theme switcher, the scrollspy, the lazy-load observer, and the search initializer. Each is small and non-blocking.

**Event handlers are short.**

```js
document.addEventListener('click', (event) => {
  const toggle = event.target.closest('.theme-toggle');
  if (toggle) handleThemeToggle();
});
```

A delegated click handler is cheaper than 20 individual ones. The work inside each handler is under 5ms on a mid-tier phone.

**No synchronous layout thrashing.** When the theme changes, I write to `document.documentElement.dataset.theme`, which sets an attribute. The browser recomputes styles once on the next animation frame. No forced layout, no `offsetWidth` reads in a loop.

## Measuring it in production

Lab measurements (Lighthouse) are useful for finding regressions. Field measurements (real users) are the ones that actually count for SEO. For a small site without a backend, the options are:

- **Chrome User Experience Report (CrUX)** — Google publishes aggregate field data for origins with enough traffic. Check your site on PageSpeed Insights; if "Real user experience" appears, CrUX has data.
- **Web Vitals JS library** — ship a small script that posts LCP, CLS, INP to your analytics. On dout.dev the analytics endpoint is a simple POST that records page hits and metrics without cookies.

The library is under 3KB gzipped and the handler is short:

```js
import { onCLS, onLCP, onINP } from 'web-vitals';

function send(metric) {
  navigator.sendBeacon('/metrics', JSON.stringify(metric));
}

onLCP(send);
onCLS(send);
onINP(send);
```

Collecting field vitals for a small blog is optional. Collecting them is how you catch regressions that lab tests miss — device variability, network variability, the long tail of "users on 3G in a basement."

## The cost I did not pay

- **No SSR framework.** A static site is already pre-rendered. Adding SSR on top is a performance anti-pattern for content sites.
- **No runtime optimization service.** No image CDN resizing on the fly, no edge function transforming HTML. The file you serve is the file you built.
- **No aggressive code splitting.** The JS is small enough that splitting adds overhead without meaningful benefit.

## The takeaway

Core Web Vitals on a static blog are a solved problem if you make the right small choices: eager LCP image, font preload, no third-party critical-path scripts, known image dimensions, font metric matching, a small main thread. Each is a specific, bounded decision. None requires a framework.

## References

- [Core Web Vitals — web.dev](https://web.dev/articles/vitals)
- [Optimize LCP](https://web.dev/articles/optimize-lcp)
- [Optimize CLS](https://web.dev/articles/optimize-cls)
- [Optimize INP](https://web.dev/articles/optimize-inp)
- [`web-vitals` JavaScript library](https://github.com/GoogleChrome/web-vitals)
- [Chrome User Experience Report](https://developer.chrome.com/docs/crux)
- [Font metric matching — web.dev](https://web.dev/articles/font-fallbacks)
