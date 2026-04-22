---
title: 'Strict CSP + Self-Hosted Fonts: `unsafe-inline` Is a Bad Friend'
date: '2026-09-22'
published: false
tags: ['security', 'performance', 'architecture']
description: 'The CSP and font policy on dout.dev: why I serve fonts from the same origin, why I dropped `unsafe-inline`, and the practical rules that make strict CSP livable.'
canonical_url: false
---

## The claim

Most sites ship a Content Security Policy that is effectively "please stop yelling at me." A policy full of `unsafe-inline`, `*`, and wildcard sources is better than no policy, but not by much. A strict CSP is achievable on a modern static blog, it stops a large class of attacks dead, and it forces a few discipline improvements that pay off in other places.

On dout.dev the policy is strict enough to block an inline `<script>` I might write by accident. This post is the policy, the font story that enabled it, and the three gotchas I hit getting there.

## The current policy

Emitted via HTTP headers in production. Also mirrored as a `<meta>` tag for local preview (with one adjustment — `upgrade-insecure-requests` belongs in headers, not meta).

```
Content-Security-Policy:
  default-src 'self';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
  img-src 'self' data: https:;
  font-src 'self';
  media-src 'self';
  manifest-src 'self';
  worker-src 'self';
  script-src 'self' 'unsafe-inline' https://giscus.app;
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://giscus.app;
  frame-src https://giscus.app https://codepen.io;
  upgrade-insecure-requests
```

Tight, but pragmatic. Three concessions and the reasons for each.

**`'unsafe-inline'` in `script-src`.** Two inline scripts survive in the head: the theme pre-paint resolver and the file-preview banner. Neither accepts user input. Both could be moved to nonce-based CSP, but for a blog with a single deployment origin the cost of a nonce (rewriting the build to inject a fresh nonce per response) exceeds the benefit.

**`'unsafe-inline'` in `style-src`.** A few critical CSS declarations are inlined for performance (the file-preview banner, the theme bootstrap). Same reasoning. For a team product I would invest in a nonce; for a blog I did not.

**`https://giscus.app` allowed on `script-src`, `connect-src`, `frame-src`.** Giscus is a third-party comment system. It runs a script in the page, connects back to its own domain, and embeds an iframe. All three are required for the feature to work.

Everything else is `'self'` or `'none'`. No CDNs, no third-party analytics, no embed farms.

## The font story that made `font-src 'self'` possible

A common CSP mistake is leaving `font-src` wide-open because "we use Google Fonts." The fix is to stop using Google Fonts as a third-party dependency and serve the fonts from your own origin.

The practical benefit is not just security. It is performance: one fewer DNS lookup, one fewer TLS handshake, one fewer cross-origin preconnect. For the LCP on a content-heavy page, that is measurable.

The mechanics:

1. Download the font files (WOFF2 and optionally WOFF) from the source (Google Fonts has a download button; Inter has a direct distribution; every good font does).
2. Place them in `src/assets/fonts/`.
3. Declare `@font-face` rules pointing at the local files.
4. Preload the critical weight so the browser starts the font download early.

```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/assets/fonts/Inter-Regular.woff2') format('woff2');
}

@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/assets/fonts/Inter-Bold.woff2') format('woff2');
}
```

```html
<link rel="preload" as="font" type="font/woff2"
      href="/assets/fonts/Inter-Regular.woff2" crossorigin />
```

`font-display: swap` tells the browser to use the fallback font until the custom one loads. It prevents the "invisible text flash" that `font-display: block` can cause.

The `crossorigin` on the preload is required even for same-origin fonts. Without it, the browser downloads the font twice — once for the preload, once for the actual request — because the cache key differs. One attribute, a real performance win.

## The three gotchas

The strict policy broke three things before it worked. Each is worth calling out.

### 1. Inline event handlers are not allowed

```html
<!-- Breaks under strict CSP -->
<button onclick="doThing()">Click</button>
```

Every inline `on*` handler in the codebase got refactored into `addEventListener` calls in a shared script. Not hard, but easy to miss — and the browser console tells you exactly where the CSP violated, so it is a mechanical cleanup.

### 2. `data:` images are commonly blocked

```
img-src 'self' data: https:;
```

The `data:` source is explicitly listed because inline SVGs and base64-encoded small images (favicons, icons) use `data:` URIs. Without that, the placeholders break.

`https:` is included because external cover images reference HTTPS URLs. Tight enough to keep out `http:` and `file:`; permissive enough to not break the CMS when a post links an external image.

### 3. The service worker needs `worker-src 'self'`

Omitted from the policy, the service worker fails to register and there is nothing in the console that clearly says why. `worker-src 'self'` makes it work.

## CSP violation reporting, for when it breaks later

The policy will break something in the future. A new feature, a new library, a copy-pasted embed. The way to find out is to wire up a CSP report endpoint.

```
Content-Security-Policy:
  …;
  report-to csp-endpoint;
  report-uri /csp-report;
```

On a static site there is no endpoint to receive the reports. I use `report-uri.com` or a simple edge function to receive violations. The first time something breaks in production, the report arrives before the complaint does.

## What a strict CSP actually stops

- **Cross-site script injection** from comments or reflected input. With `'self'` on scripts, an injected `<script src="evil.com/x.js">` does not execute.
- **Clickjacking** via framing. `frame-ancestors 'none'` (not in the policy above, worth adding) plus the appropriate `X-Frame-Options` header stops the page from being embedded.
- **Form-hijacking.** `form-action 'self'` means a forged form cannot POST to an attacker's domain.
- **Accidental third-party pixel tracking.** If a future me copy-pastes a tracking snippet, it is blocked at the CSP layer before it phones home.

## The takeaway

A strict CSP on a modern static site is achievable and not exotic. The enabling moves are serving fonts from the same origin, removing inline event handlers, and being honest about the third-party embeds you need. Everything else is `'self'` or `'none'`.

## References

- [Content Security Policy Reference — content-security-policy.com](https://content-security-policy.com/)
- [CSP on MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
- [Self-hosting Google Fonts — CSS-Tricks](https://css-tricks.com/snippets/css/using-font-face-in-css/)
- [`font-display` — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)
- [CSP Evaluator — Google](https://csp-evaluator.withgoogle.com/)
