---
title: 'pnpm Workspaces for a Single Site: Needed or Not'
date: '2026-10-20'
published: false
tags: ['tooling', 'architecture']
description: 'Why dout.dev is configured as a pnpm workspace despite being a single site, when that structure pays off, and when it is overhead without benefit.'
canonical_url: false
---

## The question I keep getting

"Your repo has `pnpm-workspace.yaml`. Why? It is one site."

Fair question. A workspace implies multiple packages that share tooling. A single site does not have multiple packages. On the face of it, `pnpm-workspace.yaml` in a single-site repo is overkill. Sometimes it is. On dout.dev it is not, and this post is the reasoning.

## What a workspace actually costs

Turning a repo into a pnpm workspace adds:

- One file, `pnpm-workspace.yaml`, with the packages glob.
- The `workspace:` protocol for internal package references, if you use it.
- A mental model where `node_modules` is hoisted at the workspace root, with per-package exceptions.

That is all. No different commands. No different build time. The incremental cost is almost zero if you stop there.

## What it lets you do later

Three things, each of which I expected to eventually need on dout.dev.

**Extract a package.** If the template engine, the CMS, or the syntax highlighter becomes useful outside this repo, it moves into `packages/pix-template-engine/` without restructuring anything. The workspace already knows how to build and test sub-packages.

**Share dev tooling across packages.** Biome config, Prettier config, TypeScript config, Playwright config — any of these can live at the root and be inherited by packages. A workspace makes this natural.

**Run scripts across the graph.** `pnpm -r test`, `pnpm -r build`, `pnpm -r lint`. If there are multiple packages, you get parallel execution and topological ordering for free.

None of these is free-as-in-beer to retrofit. Adding a workspace to an established single-package repo means moving files, updating imports, reshuffling `package.json` entries, and fixing a week of small breakages. Starting with a workspace costs nothing and avoids that migration.

## When I would skip it

On a throwaway project that will never be more than one package: skip it. On a learning project where the workspace concept itself is a distraction: skip it. The workspace is a bet on future-you wanting to extract something; if that bet is clearly wrong, do not place it.

## The actual file

```yaml
packages:
  - '.'
```

That is it. The root itself is the one package in the workspace. Adding more later is a one-line change.

Compare to the alternative where the repo grows a second package and you have to migrate on the spot. The migration is mechanical, not hard, but every "mechanical" task on a side project is a chance to stall. I prefer the inert one-line file.

## The hoisting detail

pnpm workspaces hoist shared dependencies to the root `node_modules`. That means:

- Packages resolve common dependencies from the root, which reduces duplication and disk usage.
- Per-package versions are respected when they differ.
- `node_modules/.bin` at the root contains the CLIs from any package.

The hoisting is usually invisible and always correct. The one case where it is not invisible is when a tool reads `node_modules` directly and makes assumptions — older tools occasionally get confused. I have not hit this on dout.dev, but it is the reason some projects still prefer yarn 1 or npm with explicit workspaces.

## Per-package `package.json`?

Currently there is only the root `package.json`. If I extracted the template engine into `packages/pix-template-engine/`, it would have its own `package.json` with `name`, `version`, `exports`, and dependencies declared there. The main repo would reference it as `"pix-template-engine": "workspace:*"`.

The `workspace:*` protocol means "use the current version in the workspace, whatever that is." It is the feature that makes local development across packages painless — you do not `npm link`, you do not publish to a test registry. You just work across the tree.

## Monorepo vs workspace

These terms get conflated. A monorepo is a repository that contains multiple projects. A workspace is a package-manager feature that supports monorepos. You can have a monorepo without workspaces (you can have a monorepo without any package manager conventions at all, like the Linux kernel). You cannot really have workspaces without a monorepo — it would be pointless.

For dout.dev, I currently have a monorepo-of-one, with workspace tooling ready for the day it becomes a monorepo-of-several.

## The takeaway

A pnpm workspace on a single-site repo is cheap insurance. It costs nothing today and avoids a migration tomorrow. On a throwaway project, skip it. On a project you expect to live for years, the one-line `pnpm-workspace.yaml` is worth adding upfront.

## References

- [pnpm workspaces](https://pnpm.io/workspaces)
- [The `workspace:` protocol](https://pnpm.io/workspaces#workspace-protocol-workspace)
- [Monorepo tooling comparison — monorepo.tools](https://monorepo.tools/)
- [Nx](https://nx.dev/) — if the workspace grows beyond pnpm-native capabilities
