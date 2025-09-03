# Building dout.dev

Welcome to the feather‑light Blog + CMS development notes. These notes chronicle architectural decisions, design evolution, and implementation details. All content must remain in English (project rule) – earlier Italian or mixed language fragments are being normalized.

## Development Notes

It's almost two years since I decided to build a Developer Blog for Developers.

### Assumptions

- Author content in Markdown with YAML front‑matter
- Zero runtime dependencies (vanilla-first)
- Lightweight, modular ES modules only where strictly needed
- System & user preference-aware CSS (color scheme, reduced motion)
- Deterministic build outputs (idempotent)
- Accessibility (WCAG 2.2 AAA) as a gating requirement
- Extensible front‑matter (series, pinned, keywords, layout, cover image)

### Design System

An awesome Designer, a friend of mine, `Ramona De Berardiniis`, started by designing the first version of the blog.

That version never seen the light, my bad! But served as case study for me to figure out what I wanted to do.

Recently the awesome UI/UX Designer/Engineer, another friend of mine, `Arianna Vico`, built with Figma an upgraded version of my ideas with a small styling guide.

Then I explored the idea: the browser itself already is a design system (native semantics + progressive enhancement). That insight drove abandoning external design libraries.

#### Typography

Once I built an interesting talk about Typography, with the friendship of Alberto Angeli, a I got really sensible to the topic.

I spent a lot of time defining typography goals; I finally picked system-ui + monospace fallback pairs:

- No external font fetching (performance, privacy, resilience)
- Consistent rendering across devices with minor acceptable variance

Future consideration: optional variable font self‑hosted subset if it adds measurable readability / accessibility improvements without regressing performance.

### Template, UI, UX

Current direction:

- Base layout (`layouts/base.html`) encapsulates semantic landmarks (header > nav, main, complementary aside when relevant, footer)
- Theme & Accent switchers are progressive enhancement: baseline prefers-color-scheme respected even without JS; once hydration script runs, user overrides persisted (localStorage)
- Header: responsive navigation using a CSS-first hamburger with an accessible disclosure pattern (ARIA attributes, focus management, escape to close)
- Aside region usage:
  - Post pages: scroll-spy / table of contents (progressive enhancement) + series navigation if multi-part
  - Search page: popular posts / quick filters (deferred until search telemetry exists)
- Cards: post-card, series-card share a tokenized spacing/typography system
- Pagination component is layout-neutral (works inside tag/month/series/home listings)

Open tasks:

- Decide whether series aggregate landing (`/series/`) ships MVP
- Evaluate print stylesheet (target minimal reading mode)
- Confirm minimal offline experience (offline.html) + service worker scope

### CMS

Responsibilities snapshot:

- Parse & normalize Markdown front‑matter → structured post objects
- Generate indices: posts, tags, months, series (+ counts & stable ordering)
- Ensure template scaffolding exists (idempotent creation) without overwriting manual edits
- Render pages using template engine; uphold formatting & accessibility invariants
- Provide watch mode with granular invalidation (only re-render affected artifacts)
- Emit build & validation diagnostics (JSON report candidate)

Upcoming enhancements:

- Partial rebuild heuristics (dependency graph between components/templates and pages)
- Diff-based index regeneration (avoid rewriting unchanged indices)
- Pluggable hook system (`preRender`, `postRender`, `afterIndices`) to allow future features (feeds, sitemap) without core churn

---

## Development Progress (August 2025)

### 🎉 Major Milestones Completed

- Template Engine core (includes inheritance, filters, loops, conditionals)
- Layout system + design tokens (layered CSS approach)
- Post / Tag / Month pages generation
- Series model & `series.json` specification drafted (implementation pending)

### 🔄 In Progress

- Series page template & integration
- Header navigation responsive + keyboard interactions
- Theme & accent persistence script

### 🧪 Testing Focus

- Add unit tests for series normalization & index integrity
- Snapshot tests for multi-series membership ordering
- Validation tests ensuring unpublished / scheduled posts excluded consistently

### 🗺 Next Steps

1. Implement series aggregation page template & generation
2. Add offline.html baseline + (optional) service worker scaffold (deferred if scope creeps)
3. Integrate search with series labels & keywords
4. Introduce sitemap & feed generation hooks (post indices build)
5. Performance budget instrumentation (build timing metrics)
