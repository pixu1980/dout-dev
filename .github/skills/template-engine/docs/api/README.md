# Portable Template Engine API

This skill pack now includes a self-contained copy of the template engine source under `code/`.
Nothing in that portable implementation imports files from `scripts/template-engine` or other repo-only paths.

## Public Entrypoints

- `code/public/index.js`: host-agnostic exports such as expression parsing, filter registration, and the portable renderer base class
- `code/public/node.js`: Node.js build-time entrypoint with filesystem loading and `jsdom`
- `code/public/browser.js`: browser runtime entrypoint with template-registry loading and native DOM adapters
- `code/public/ssr.js`: SSR entrypoint with template-registry loading and `jsdom`

## External Dependencies To Install In A Target Project

- `marked` for `md`, `rawMd`, and `markdown` filters
- `jsdom` for the Node.js and SSR entrypoints

Example install command:

```bash
pnpm add marked jsdom
```

If you only adopt the browser runtime entrypoint, `marked` is enough unless you also choose to provide a `jsdom`-based DOM adapter.
