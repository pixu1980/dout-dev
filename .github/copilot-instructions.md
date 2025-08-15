COPILOT_INSTRUCTIONS for dout-dev

- Always follow `COPILOT_RULES.md` (project-specific coding standards).
- Code style: use the formatters configured in `.vscode/settings.json` for generated files.
  - The project enforces specific formatters per-language (Prettier for HTML/Markdown/JSON, Biome for JS/CSS).
- No external runtime dependencies should be introduced into the generated site code; keep the runtime vanilla JS/CSS/HTML.
- Accessibility: templates must use semantic HTML and ARIA when appropriate.
- Testing: add small Node-based tests for template engine changes inside `cms/template-engine/tests`.
- CI: ensure the GitHub Action builds and runs tests before deploying.
- When asked to modify the template engine, use `cms/template-engine/index.js` as the public entrypoint which re-exports the consolidated implementation from component modules and keep a single public entrypoint.

**🚨 CRITICAL - Template Syntax Rule:**
- NEVER use Liquid/Jekyll syntax `{% %}` in templates
- This project uses CUSTOM template engine with syntax like `<if condition="">`, `<for each="">`, `<include src="">`
- CI will automatically FAIL builds containing `{%` or `%}` patterns
- See COPILOT_RULES.md for complete syntax reference
