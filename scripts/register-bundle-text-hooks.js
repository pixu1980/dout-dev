import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';

const PREFIX = 'bundle-text:';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith(PREFIX)) {
      return nextResolve(specifier, context);
    }

    const resolvedUrl = new URL(specifier.slice(PREFIX.length), context.parentURL).href;

    return {
      shortCircuit: true,
      url: `${PREFIX}${resolvedUrl}`,
    };
  },
  load(url, context, nextLoad) {
    if (!url.startsWith(PREFIX)) {
      return nextLoad(url, context);
    }

    const fileUrl = new URL(url.slice(PREFIX.length));
    const sourceText = readFileSync(fileUrl, 'utf8');

    return {
      shortCircuit: true,
      format: 'module',
      source: `export default ${JSON.stringify(sourceText)};`,
    };
  },
});
