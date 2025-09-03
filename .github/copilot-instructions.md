COPILOT_INSTRUCTIONS for dout-dev

- Always follow `COPILOT_RULES.md` (project-specific coding standards).
- Code style: use the formatters configured in `.vscode/settings.json` for generated files.
  - The project enforces specific formatters per-language (Prettier for HTML/Markdown/JSON, Biome for JS/CSS).
- No external runtime dependencies should be introduced into the generated site code; keep the runtime vanilla JS/CSS/HTML.
- Accessibility: templates must use semantic HTML and ARIA when appropriate.
- Testing: add small Node-based tests for template engine changes inside `cms/template-engine/tests`.
- CI: ensure the GitHub Action builds and runs tests before deploying.
- When asked to modify the template engine, use `cms/template-engine/index.js` as the public entrypoint which re-exports the consolidated implementation from component modules and keep a single public entrypoint.

Command execution policy (pnpm)

- Always run repository scripts from the workspace root without passing an explicit `-C <path>` argument.
- Prefer the concise form `pnpm -s <script>` (e.g., `pnpm -s test`, `pnpm -s lint`, `pnpm -s build`).
- Do not include absolute paths in pnpm commands; rely on the current workspace folder.

**🚨 CRITICAL - Template Syntax Rule:**

- NEVER use Liquid/Jekyll syntax "{%% %%}" in templates
  - This project uses CUSTOM template engine with syntax like `<if condition="">`, `<for each="">`, `<include src="">`
  - CI will automatically FAIL builds containing the Liquid token pattern (escaped in docs)
- See COPILOT_RULES.md for complete syntax reference

Additional mandatory rules for template authoring:

- Do NOT place `<if>` elements inside an opening tag to conditionally add attributes.
  - Instead, use JavaScript expressions (ternary or logical OR) inside attribute values.
  - Examples:
    - ✅ `width="{{ post.coverWidth ? post.coverWidth : '' }}"`
    - ✅ `height="{{ post.coverHeight || '' }}"`
    - ❌ `<img <if condition="post.coverWidth">width="{{ post.coverWidth }}"</if> />`
- Prefer expressions that result in an empty string when the attribute should be omitted. The template engine will keep the attribute with an empty value which is acceptable; avoid injecting or removing attributes via inline `<if>`.
