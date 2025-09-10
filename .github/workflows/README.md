GitHub Pages is deployed through `.github/workflows/deploy-pages.yml`.

Behavior:

- On every push to `main`, on tags matching `v*`, and on manual dispatch, the workflow runs.
- It installs Node 22 and pnpm, runs `pnpm build`, and uploads `dist/` to GitHub Pages.
- The build copies `CNAME`, feeds, sitemap, search indexes, and `sw.js` into the final artifact.

CI is enforced through `.github/workflows/ci.yml`.

Behavior:

- Every push and pull request against `main` runs tests, spellcheck, lint, build, link/security validation, and visual regression.
- Pull requests upload a `pr-preview-<number>` artifact containing the full `dist/` directory.
- Visual regression uses Playwright against the built preview server, with reduced-motion preferences applied for deterministic snapshots.

Adjustments:

- If your build step changes, update the `Build site` step in `.github/workflows/deploy-pages.yml`.
- If you add or remove static deploy metadata, keep `scripts/build-assets.js` and `scripts/verify-dist.cjs` aligned.
