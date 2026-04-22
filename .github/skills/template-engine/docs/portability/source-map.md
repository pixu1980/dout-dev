# Template Engine Source Map

This file documents how the current repo-local template engine should be moved into the
portable skill pack.

## Current Repo To Skill Pack Mapping

| Current repo path | Skill pack path | Notes |
| --- | --- | --- |
| `scripts/template-engine/index.js` | `code/public/index.js` | Keep this as the stable consumer entrypoint |
| `scripts/template-engine/_expression-parser.js` | `code/core/expression/expression-parser.js` | Pure logic |
| `scripts/template-engine/_filters.js` | `code/core/filters/builtin-filters.js` | Pure logic plus filter registration |
| `scripts/template-engine/_renderer.js` | `code/core/directives/` + `code/core/render/` + `code/adapters/*/` | Split by host responsibility |
| `scripts/template-engine/tests/core.test.js` | `tests/integration/core.test.js` | Covers public engine behavior |
| `scripts/template-engine/tests/directives.test.js` | `tests/integration/directives.test.js` | Directive flow tests |
| `scripts/template-engine/tests/expression-parser.test.js` | `tests/unit/expression-parser.test.js` | Pure parser tests |
| `scripts/template-engine/tests/filters.test.js` | `tests/unit/filters.test.js` | Pure filter tests plus registration tests |
| `scripts/template-engine/tests/inheritance.test.js` | `tests/integration/inheritance.test.js` | Include and extends flow |
| `scripts/template-engine/tests/renderer.test.js` | `tests/integration/renderer.test.js` | End-to-end rendering |
| `scripts/template-engine/tests/seo-head.test.js` | `tests/integration/seo-head.test.js` | Output integration coverage |

## Recommended Migration Order

1. Copy the public API surface.
2. Extract pure parser and filter logic.
3. Split directive semantics from host-specific rendering.
4. Add Node, browser, and SSR adapters.
5. Move tests and fixtures.
6. Add examples and portability notes.
