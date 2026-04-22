---
name: template-engine
description: >
  Use this skill when working on the dout.dev custom template engine and you need to
  preserve or introduce support for build-time execution in Node.js, runtime execution,
  or both. It provides a decision workflow, architecture rules, implementation steps,
  and validation criteria for directives, filters, includes, inheritance, and renderer changes.
alternative: https://github.com/capricorn86/happy-dom
---

# Template Engine

This skill packages the workflow, the portable source layout, and a self-contained
template-engine implementation for modifying, extracting, and reusing a custom template engine
across projects.

It is currently stored as a workspace skill in this repository, and the engine source now lives
inside this skill pack under `code/` so it can be copied into other repositories without also
copying `scripts/template-engine` or adjacent repo-only modules.

Its target is dual runtime support across:

- Build-time execution in Node.js
- Browser runtime execution
- SSR or edge-style runtime execution without direct filesystem access

It is designed for requests such as:

- Add or change directives like `<if>`, `<for>`, `<switch>`, `<include>`, `<extends>`, or `<md>`
- Add or change filters and expression parsing
- Refactor the renderer without breaking current templates
- Make the engine work at build time in Node.js, at runtime, or in a dual-runtime design
- Add tests for regressions in includes, inheritance, locals/data handling, or serialization

## Current Repo Source Map

- Public entrypoint: `scripts/template-engine/index.js`
- Main implementation: `scripts/template-engine/_renderer.js`
- Shared parser logic: `scripts/template-engine/_expression-parser.js`
- Built-in filters: `scripts/template-engine/_filters.js`
- Re-export shims: `renderer.js`, `expression-parser.js`, `filters.js`
- Tests: `scripts/template-engine/tests/*.test.js`

## Skill Pack Layout

When you convert the engine from repo-local source into reusable skill-owned source, use this
layout inside the skill directory:

```text
template-engine-dual-runtime/
  SKILL.md
  code/
    public/
      index.js
      node.js
      browser.js
      ssr.js
      expression-parser.js
      filters.js
      renderer.js
    core/
      expression/
        expression-parser.js
      filters/
        builtin-filters.js
      directives/
      render/
        template-renderer.js
    adapters/
      node/
        index.js
      browser/
        index.js
      ssr/
        index.js
    shared/
      portable-marked-options.js
      virtual-path.js
  tests/
    unit/
      expression-parser.test.js
      builtin-filters.test.js
    integration/
      node-template-engine.test.js
      runtime-template-engine.test.js
    fixtures/
      templates/
      data/
  examples/
    node-build/
      example.js
    browser-runtime/
      example.js
    ssr-runtime/
      example.js
  docs/
    api/
      README.md
    migration/
      README.md
    portability/
```

## Included Portable Engine

The portable implementation is now real, not only planned. When you copy this skill pack into
another project, the files under `code/` are the reusable engine source.

Use these entrypoints:

- `code/public/node.js` for filesystem-backed Node.js builds
- `code/public/browser.js` for browser runtime rendering with an in-memory template registry
- `code/public/ssr.js` for SSR rendering with an injected or registry-backed loader
- `code/public/index.js` for host-agnostic exports such as the parser, filter registration, and the portable renderer base class

### Folder Intent

- `code/public/` keeps the stable exported entrypoint surface for consumers
- `code/core/expression/` keeps expression parsing and evaluation
- `code/core/filters/` keeps built-in and optional filter logic
- `code/core/directives/` keeps directive handlers and directive semantics
- `code/core/render/` keeps render orchestration that is still environment-agnostic
- `code/adapters/node/` keeps filesystem and Node build-time adapters
- `code/adapters/browser/` keeps browser runtime adapters
- `code/adapters/ssr/` keeps SSR or edge runtime adapters without direct filesystem assumptions
- `code/shared/` keeps helpers used by multiple adapters or core modules
- `tests/unit/` keeps pure logic tests
- `tests/integration/` keeps end-to-end template rendering tests
- `tests/fixtures/templates/` keeps reusable fixture templates
- `tests/fixtures/data/` keeps reusable fixture data payloads
- `examples/node-build/` keeps build-time usage examples
- `examples/browser-runtime/` keeps client-side usage examples
- `examples/ssr-runtime/` keeps SSR or edge usage examples
- `docs/api/` keeps public API and extension notes
- `docs/migration/` keeps extraction and adoption notes for new projects
- `docs/portability/` keeps environment compatibility guidance and source maps

## How To Map Current Repo Files Into The Skill Pack

Use this mapping when copying or refactoring the current engine into reusable skill-owned code:

| Current repo file | Skill pack target |
| --- | --- |
| `scripts/template-engine/index.js` | `code/public/index.js` |
| `scripts/template-engine/_expression-parser.js` |
| `scripts/template-engine/_filters.js` | `code/core/filters/builtin-filters.js` |
| `scripts/template-engine/_renderer.js` | Split between `code/core/directives/`, `code/core/render/`, and adapter files |
| `scripts/cms/marked-syntax.js` | `code/shared/portable-marked-options.js` |
| `scripts/template-engine/tests/*.test.js` | `tests/unit/` or `tests/integration/` depending on scope |

Prefer reusable names in the skill pack. Keep underscore-prefixed filenames only if they are truly
internal compatibility shims during migration.

## Hard Rules

- When applying this skill inside the current repo, keep a single public entrypoint in `scripts/template-engine/index.js`
- Inside the portable skill pack, keep environment-specific public entrypoints under `code/public/`
- Keep all code and documentation in English
- Use `node:` prefixes for Node.js built-ins
- Use relative paths only; never hardcode workstation-specific absolute paths
- Do not introduce Liquid or Jekyll syntax
- Preserve the existing custom syntax such as `<if>`, `<for>`, `<include>`, and `<extends>`
- Add or update Node tests for every template-engine behavior change
- Run commands from the repo root with `pnpm`
- If includes use `data=` or `locals=`, do not break the existing bypass behavior in string-level preprocessing
- When packaging source into this skill, keep the portable version free from repo-specific absolute paths and project-only assumptions

## First Decision: Which Runtime?

Classify the request before writing code.

### 1. Build-Time Only

Choose this path when:

- The engine is only used during CMS generation or static builds
- File-system template loading is acceptable
- `JSDOM` is acceptable in the rendering pipeline
- The request is about current repo behavior only

Preferred strategy:

- Keep the current `TemplateEngine` and `TemplateRenderer` architecture
- Apply minimal changes to parser, filters, directives, or preprocessing
- Avoid unnecessary abstractions

### 2. Runtime Only

Choose this path when:

- Templates must render after deployment
- The execution environment cannot depend on `node:fs`, `node:path`, or `process.cwd()`
- The caller can provide template strings or a loader callback

Preferred strategy:

- Move environment-agnostic logic into pure modules
- Accept template source and dependency injection instead of reading from disk directly
- Avoid Node-specific APIs in the hot path

### 3. Dual Runtime

Choose this path when:

- The same template semantics must work in Node.js builds and in runtime rendering
- The request explicitly mentions both build-time and runtime execution
- You need to preserve current CMS behavior while enabling a second host environment

Preferred strategy:

- Split the engine into a pure core and host adapters
- Keep a stable public API at `scripts/template-engine/index.js`
- Inject host-specific concerns such as template loading, path resolution, and DOM creation
- Be ready to scaffold the adapter boundaries when the request explicitly asks for implementation help

## What Is Pure Core vs Host-Specific?

### Pure Core

These parts should stay reusable across environments whenever possible:

- Expression parsing
- Expression evaluation
- Filter registration and execution
- Directive semantics for `<if>`, `<for>`, `<switch>`, `<md>`, `<include>`, and `<extends>`
- Context merging for `data=` and `locals=`
- Loop metadata such as `loop.index`, `loop.first`, `loop.last`, and `loop.length`

### Host-Specific

These parts must be isolated behind adapters or injected hooks:

- Reading templates from disk
- Resolving relative template paths
- DOM parsing and serialization
- Browser vs Node document creation
- Any use of `process.cwd()`

## Recommended Workflow

### Step 1. Inspect the Change Surface

Read the public entrypoint and the relevant implementation files first.

Minimum files to inspect:

- `scripts/template-engine/index.js`
- `scripts/template-engine/_renderer.js`
- `scripts/template-engine/_expression-parser.js`
- `scripts/template-engine/_filters.js`
- Relevant tests in `scripts/template-engine/tests`

Map the change to one of these buckets:

- Parser or evaluation
- Filter behavior
- Directive behavior
- Includes and inheritance
- File loading and path resolution
- DOM rendering and serialization

### Step 2. Preserve Public Behavior First

Before refactoring, identify what must remain stable:

- `TemplateEngine.render(templatePath, data, options)` should remain the default build-time flow
- `registerFilter(name, fn)` should remain available
- Existing project templates should keep their syntax and semantics
- Existing tests should keep passing unless behavior is intentionally changed
- The reusable skill-owned source should keep equivalent semantics even if filenames and folder layout are normalized

### Step 3. Choose the Smallest Valid Architecture

Use this decision table:

| Situation | Preferred move |
| --- | --- |
| Only parser/filter bug | Fix the pure module directly |
| Only directive bug in Node build flow | Patch current renderer with minimal scope |
| Runtime support requested for string rendering only | Extend `renderString` and inject a loader/DOM adapter |
| Runtime support requested for template-path rendering too | Add host adapters and keep Node defaults in the public entrypoint |
| Both modes must coexist long-term | Extract a reusable core and thin Node/runtime adapters |

### Step 4. For Dual Runtime, Separate the Layers

When both modes are required, use this split:

#### Public API Layer

- Keep `scripts/template-engine/index.js` as the only public entrypoint
- Export the default engine and any renderer class intentionally exposed for tests or tooling

#### Core Layer

- Keep expression parsing and filters environment-agnostic
- Keep directive semantics independent from `fs`, `path`, and `process`
- Prefer passing already-loaded template content when possible

#### Node Adapter Layer

- Default to filesystem loading from `rootDir`
- Resolve relative templates for build-time usage
- Use `JSDOM` where needed for Node-based rendering

#### Runtime Adapter Layer

- Accept template strings or an injected template loader
- Accept an injected document factory or DOM adapter
- Never require `node:fs`, `node:path`, or `process.cwd()` inside the runtime path
- Support both browser-style and SSR-style callers when the request needs runtime parity

### Step 4b. When Scaffolding Is Requested

If the user wants implementation help and not just review or planning, propose a minimal structure like this:

- `index.js` as the only public entrypoint
- A pure core for expressions, filters, and directive semantics
- A Node adapter for filesystem loading and default build-time behavior
- A runtime adapter that accepts injected loaders and DOM creation hooks
- Focused tests proving that the same template semantics work in both paths

If the user explicitly wants the whole engine extracted into the skill pack, scaffold the reserved
subfolders first, then move code in this order:

1. Public API files
2. Expression and filter core
3. Directive and rendering core
4. Node adapter
5. Browser adapter
6. SSR adapter
7. Unit and integration tests
8. Fixtures, examples, and migration notes

Prefer the smallest viable scaffolding that preserves current repo behavior.

### Step 5. Protect Known Fragile Areas

Always add or update regressions for these cases:

- Includes with `data=` or `locals=`
- Nested includes
- `<extends>` plus `<block>` replacement
- Loop rendering with arrays of objects
- Nested conditionals
- Markdown rendering
- Raw HTML insertion through filters such as `raw`
- Missing template handling
- Missing variables and undefined path traversal

## Implementation Guidelines

### If the change is Build-Time Only

- Prefer direct edits in the current implementation files
- Do not add abstraction layers unless the current Node-only design is the actual problem
- Keep template path rendering simple and explicit

### If the change adds Runtime Support

Use this checklist:

- Ensure the runtime path can start from `renderString` or equivalent string input
- Inject template loading instead of assuming filesystem access
- Inject path or template resolution instead of assuming `rootDir`
- Inject DOM creation or provide a DOM-independent fallback where possible
- Keep Node defaults for backward compatibility

### If the change introduces a new option

Prefer options such as:

- `rootDir`
- `loadTemplate`
- `resolveTemplate`
- `currentDir`
- `domAdapter`
- `environment`

Do not add new options if existing dependency injection points already solve the problem.

## Testing Workflow

### Required Tests

For every behavior change, update or add tests in `scripts/template-engine/tests`.

Use the existing suite as the baseline:

- `core.test.js`
- `directives.test.js`
- `expression-parser.test.js`
- `filters.test.js`
- `inheritance.test.js`
- `renderer.test.js`
- `seo-head.test.js`

When the engine has been copied into the skill pack, mirror the suite using this split:

- Pure parser and filter tests in `tests/unit/`
- Renderer and directive flow tests in `tests/integration/`
- Reusable templates and data in `tests/fixtures/`

### Required Validation

Run from the repo root:

```bash
pnpm -s test
```

If the change is broad enough to affect generated output or repo-wide quality, also run:

```bash
pnpm -s quality:check
```

If you need focused execution during development, use the same Node test bootstrap as the repo script:

```bash
node --import ./scripts/register-bundle-text-hooks.js --test scripts/template-engine/tests/*.test.js
```

## Done Criteria

The task is not done until all applicable checks below are true:

- The public entrypoint still lives in `scripts/template-engine/index.js`
- The requested mode is supported: build-time, runtime, or both
- Node-specific APIs are not required in the runtime execution path
- Existing template syntax still works unless the task explicitly changes it
- Includes with `data=` or `locals=` still preserve the passed context
- Tests cover the changed behavior
- `pnpm -s test` passes
- Documentation is updated if the public API changed
- If the goal is portability, the skill pack source is self-contained and does not import files outside the skill folder
- If the goal is portability, the skill pack subfolders exist and the source map from repo files to skill-owned files is documented

## What to Avoid

- Do not rework the whole engine for a local bug fix
- Do not couple pure evaluation logic to filesystem access
- Do not add browser-only code to the default Node build path without a guard or adapter
- Do not create multiple competing public entrypoints
- Do not change syntax from the custom XML-like directives to another template language

## Example Prompts

- Make the template engine support a browser runtime without breaking the current Node.js build flow
- Refactor the renderer so includes can be resolved by an injected loader instead of `node:fs`
- Add a new built-in filter and tests without changing the public API
- Split Node-only template loading from pure directive evaluation
- Review this template-engine change and check whether it still supports both build-time and runtime execution
- Move the current template engine into the reusable skill pack structure and keep parity with the repo implementation
- Create the browser and SSR adapters for the skill-owned template engine source

## When This Skill Becomes Cross-Project Ready

This skill can be considered reusable across projects when all of the following are true:

- The engine source no longer depends on this repo's directory layout
- The public API lives under `code/public/`
- Runtime adapters do not require direct filesystem access
- Tests and fixtures live inside the skill pack instead of only in the current repo
- Examples show how to adopt the engine in Node build, browser runtime, and SSR runtime contexts
