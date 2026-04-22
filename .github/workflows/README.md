GitHub Pages is deployed through `.github/workflows/deploy-pages.yml`.

Behavior:

- The workflow runs only when a new tag matching `vX.Y.Z` is pushed.
- It installs Node 24 and pnpm, runs `pnpm build`, and uploads `dist/` to GitHub Pages.
- The build copies `CNAME`, feeds, sitemap, search indexes, and `sw.js` into the final artifact.

Server-side CI is not used for this repository.

Behavior:

- Validation is enforced locally through `.husky/pre-push`.
- The pre-push check runs template syntax validation, spellcheck, favicon checks, formatting checks, tests, build, and dist validations before Git allows the push.

Note:

- `.husky/pre-commit` still keeps the lightweight favicon check as a fast local guard.

Adjustments:

- If your build step changes, update the `Build site` step in `.github/workflows/deploy-pages.yml`.
- If your local quality gate changes, keep `prepush:check` in `package.json` aligned with the expected release validations.
- If you add or remove static deploy metadata, keep `scripts/build-assets.js` and `scripts/verify-dist.cjs` aligned.
