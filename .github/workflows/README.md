This workflow watches the `data/posts/` folder for new markdown files and triggers a site build.

Behavior:

- On push of any `data/posts/*.md` file, the workflow runs.
- It executes `node ./cms/index.js` (if present) to produce static files into `./public`.
- The workflow copies the repo `CNAME` file into `public/CNAME` before uploading the artifact to GitHub Pages.

Adjustments:

- If your build step differs, update the `Build site` step in `.github/workflows/publish-on-new-post.yml`.
