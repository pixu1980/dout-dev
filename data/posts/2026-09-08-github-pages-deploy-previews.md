---
title: 'GitHub Pages Deploy Previews: PR Builds, Artifacts, Rollback'
date: '2026-09-08'
published: false
tags: ['tooling', 'ci', 'static-site']
description: 'How dout.dev gets deploy previews and safe rollbacks on free GitHub Pages infrastructure, without a third-party preview service.'
canonical_url: false
---

## The gap GitHub Pages leaves open

GitHub Pages is excellent for serving a static site. It is also, by default, missing two features that Netlify and Vercel have made everyone expect: **deploy previews on pull requests**, and **one-click rollback** to a previous deploy.

Neither is actually missing. They are just not turned on. The pieces exist in GitHub Actions; you have to wire them up. On dout.dev, that wiring is about 40 lines of YAML and one simple naming convention.

## The production pipeline

Production deploys run from `main` or from `workflow_dispatch`. The workflow has two jobs — build and deploy — and produces a site at `https://dout.dev`.

```yaml
name: Deploy Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: pnpm/action-setup@v4
        with: { version: 10.33.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

That is a complete Pages workflow. The `concurrency` group prevents two overlapping deploys from fighting. The `environment: github-pages` line is required for the Pages deployment to succeed and also records deploy history.

## PR previews, without a third-party service

GitHub Pages has one "live" site per repository. You cannot deploy a PR to a live preview URL the way Netlify does.

What you can do: **build the PR, upload the `dist/` as an artifact, and comment on the PR with a link to download it.** A reviewer can extract the zip locally and open it. For a single-author blog, that is often enough.

```yaml
name: PR Build

on:
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10.33.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - uses: actions/upload-artifact@v4
        with:
          name: dist-${{ github.event.pull_request.number }}
          path: dist
          retention-days: 14
```

The artifact is named with the PR number, so CI history stays navigable. Retention is two weeks — long enough to review, short enough to not accumulate forever.

## Real PR previews with a second GitHub Pages repo

For reviewers who want a clickable URL rather than a zip, there is a second pattern: a separate repository that hosts "preview" deploys at URLs like `preview-123.dout.dev`.

The CI workflow pushes the PR's `dist/` into a subdirectory of the preview repo's `main` branch, and the preview site is configured to serve those subdirectories. A bot comments on the PR with the preview URL.

This is more setup than most personal projects need. For dout.dev I use the zip-artifact pattern. For a team project, I would build the separate-repo preview pipeline.

## Rollback in one minute

This is the feature I use more often than I expected.

When a bad deploy reaches production — wrong content, broken CSP, accidentally unpublished post — the recovery path is:

1. Go to Actions → Deploy Pages in the repo.
2. Find the last known-good run.
3. Click "Re-run all jobs."

That rebuilds the old commit and redeploys it. One minute from "oh no" to "fixed."

The prerequisites:

- **Every production deploy is triggered by a commit on `main`.** No manual artifact uploads. Every deploy is reproducible from a specific SHA.
- **Build-time inputs are either committed or in secrets.** If a deploy depends on an environment variable that is not tracked, re-running the old commit with a new secret value produces a different artifact. That is the most common rollback failure mode.

The workflow at the top of this post satisfies both. That is why it rolls back cleanly.

## The commit-based deploy trail

A useful side effect of "every deploy is a commit" is that the Actions history is the deploy history. You can see which commit is live right now, which commits have been deployed before, and how long each deploy took.

The Pages environment in the repo settings also tracks "Active deployment" and shows the deployed commit SHA at the top. If you have to answer "what is live right now?" for a coworker, that screen is the authoritative source.

## What I did not add

- **Automatic atomic rollback on failure.** If the build fails, no deploy happens. If the deploy itself fails, GitHub Pages does not update. That is the correct level of automation for a static site.
- **Slack or email notifications on deploy.** Overkill for a single-author blog. The Actions email notifications are enough.
- **Canary deploys.** A static blog does not need canaries. The unit of change is one post.

## The takeaway

GitHub Pages with GitHub Actions is a complete deploy pipeline, including previews and rollback, if you accept that previews come as artifacts rather than live URLs. For most personal projects that is the right trade-off — no third-party service, no extra auth, and the same UI you are already using for the repo.

## References

- [GitHub Pages: deploy from GitHub Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [`actions/deploy-pages`](https://github.com/actions/deploy-pages)
- [`actions/upload-artifact`](https://github.com/actions/upload-artifact)
- [GitHub Environments](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment)
