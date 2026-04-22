#!/usr/bin/env node

import { defaultIssueFormat, defaultOutputFormat, inspectUrl, renderIssues } from './index.js';

function printHelp() {
  console.log(`Usage: node scripts/og-check/cli.js [options] <url>

Options:
  -o, --output-format <opengraph|twitter|table|json|none>
  -f, --issue-format <human|json|ci>
  --rewrite-origin <from=to>     Rewrite absolute URLs during validation
  --skip-url-checks              Skip HEAD/GET validation for meta URLs
  --timeout <ms>                 Network timeout in milliseconds
  -h, --help                     Show this help
`);
}

function parseArgs(argv) {
  const args = [...argv];
  const config = {
    issueFormat: defaultIssueFormat(),
    outputFormat: defaultOutputFormat(),
    rewriteOrigins: [],
    timeoutMs: 5000,
    url: '',
  };

  while (args.length) {
    const arg = args.shift();
    if (!arg) continue;

    switch (arg) {
      case '-o':
      case '--output-format':
        config.outputFormat = args.shift() || config.outputFormat;
        break;
      case '-f':
      case '--issue-format':
        config.issueFormat = args.shift() || config.issueFormat;
        break;
      case '--rewrite-origin': {
        const raw = args.shift() || '';
        const [from, to] = raw.split('=');
        if (!from || !to) {
          throw new Error(`Invalid rewrite origin: ${raw}`);
        }
        config.rewriteOrigins.push({ from, to });
        break;
      }
      case '--skip-url-checks':
        config.checkUrlStatus = false;
        break;
      case '--timeout':
        config.timeoutMs = Number.parseInt(args.shift() || '5000', 10) || 5000;
        break;
      case '-h':
      case '--help':
        config.help = true;
        break;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown option: ${arg}`);
        }
        config.url = arg;
        break;
    }
  }

  return config;
}

async function main() {
  const config = parseArgs(process.argv.slice(2));

  if (config.help || !config.url) {
    printHelp();
    process.exit(config.help ? 0 : 1);
  }

  const result = await inspectUrl(config.url, config);

  if (config.outputFormat !== 'none' && result.preview) {
    process.stdout.write(`${result.preview}\n`);
  }

  const issues = renderIssues(result.validation, {
    issueFormat: config.issueFormat,
    url: config.url,
  });

  if (issues) {
    const stream =
      config.issueFormat === 'json' && config.outputFormat === 'none'
        ? process.stdout
        : process.stderr;
    stream.write(`${issues}\n`);
  }

  process.exit(result.validation.status === 'errors' ? 1 : 0);
}

main().catch((error) => {
  console.error(`❌ og-check failed: ${error.message}`);
  process.exit(1);
});
