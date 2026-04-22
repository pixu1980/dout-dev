# Security Policy

## Scope

This policy covers site, repository, automations, dependencies, and connected systems of dout.dev.

Do not use public issues to report vulnerabilities.

## Supported versions

As a community web project, supported version is the active main branch.

| Area | Support |
| --- | --- |
| `main` branch | Supported |
| Current build/deploy flow | Supported |
| Obsolete branches or personal forks | Not supported |
| Markdown articles | Out of technical security scope, except personal data, XSS, malicious assets, or dangerous links |

## What to report privately

Report privately:

- XSS
- injection
- exposed secrets
- tokens/credentials in repository
- build/deploy vulnerabilities
- compromised dependencies
- supply chain risk
- risky GitHub configuration
- permission bypass
- malicious links or assets
- personal data exposure
- automated abuse of Discussions/issues/PRs

## What is not a vulnerability

Open public issue (not security report) for:

- typos
- broken links
- non-sensitive visual bugs
- editorial issues
- feature requests
- content discussions
- Code of Conduct violations without technical/data risk

For Code of Conduct issues involving personal data or safety risk, use private channel.

## How to report

Recommended channels:

1. repository GitHub Security Advisory, if enabled
2. private email to configure: `TODO: security@dout.dev`
3. private contact with trusted maintainer

Do not publish working exploits in issues, PRs, or Discussions.

## Useful report details

Include:

- vulnerability description
- reproduction steps
- potential impact
- affected URL, commit, or file
- screenshots or safe proof of concept if useful
- mitigation suggestions
- your contact if you want follow-up

## Response process

Maintainers will try to:

1. acknowledge receipt
2. assess impact
3. reproduce issue
4. prepare fix or mitigation
5. publish advisory when needed
6. thank reporter when desired

## Disclosure

Do not disclose publicly until maintainers had reasonable time to analyze and fix.

Coordinated disclosure protects users, contributors, and project.

## Credits

Security reporters can be acknowledged publicly if desired and safe.

## Secrets in repository

If you find secrets, tokens, or keys:

- do not use them
- do not post them in public issues
- report privately
- include commit/file references
- assume they must be revoked, not just removed from code

## Dependencies

When updating dependencies:

- prefer small, reviewable updates
- read relevant changelogs
- avoid unnecessary packages
- check license and maintenance
- verify build and tests
