# Adopt In Another Project

Use this flow when you copy the skill pack into a different repository and want the template engine to come with it.

## Copy Steps

1. Copy the full `template-engine-dual-runtime` folder into the target repository.
2. Keep the `code/` subtree intact so the local imports continue to resolve.
3. Install `marked` and, when using Node.js or SSR adapters, install `jsdom`.
4. Import the correct entrypoint for the host environment:
	- `code/public/node.js` for filesystem-based build-time rendering
	- `code/public/browser.js` for browser runtime rendering with an in-memory template registry
	- `code/public/ssr.js` for SSR rendering with an injected or registry-backed loader
5. Copy or adapt the tests under `tests/` to protect the behaviors you rely on.

## Recommended First Integration

- Start from `examples/node-build/example.js` if the target project renders templates from disk.
- Start from `examples/browser-runtime/example.js` or `examples/ssr-runtime/example.js` if the target project uses in-memory templates or injected loaders.

## Portability Guardrails

- Do not reintroduce imports from the original repo such as `scripts/cms/*` or `scripts/template-engine/*`.
- Keep new host-specific code inside `code/adapters/`.
- Keep reusable logic inside `code/core/` or `code/shared/`.
