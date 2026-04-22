# Contributing

Thanks for contributing to dout.dev.

dout.dev is a community/open blog: anyone can fork this repository, add a Markdown article, and propose it via pull request. Article comments are managed through GitHub Discussions linked to the repository.

## Ways to contribute

You can contribute by:

- proposing an article in Markdown
- improving an existing article
- fixing typos, broken links, or formatting issues
- improving code, performance, accessibility, UX, or build pipeline
- improving documentation, templates, and automations
- participating constructively in Discussions
- helping with reviews when you have the proper role and permissions

## Before starting

Read these files:

- `CODE_OF_CONDUCT.md`
- `CONTENT_GUIDELINES.md`
- `GOVERNANCE.md`
- `CONTRIBUTION_TIERS.md`
- `PUBLISHING_STRATEGY.md`

## Propose an article

1. Fork the repository.
2. Create a descriptive branch name, for example `article/css-container-queries`.
3. Add Markdown file in the project article folder.
4. Use a short, readable, stable slug.
5. Fill frontmatter.
6. Check grammar, links, code, images, and attribution.
7. Open a pull request using template.
8. Wait for review and maintainer voting.

### Suggested frontmatter

```yaml
---
title: "Article title"
description: "A short and clear description."
author: "Name or handle"
date: "YYYY-MM-DD"
tags:
  - css
  - accessibility
status: "draft"
canonical: ""
discussion: ""
license: "TODO: repository content license"
---
```

`discussion` can be empty in PR and linked later when article is published.

## Minimum requirements for an article

An article must:

- be relevant to blog themes
- include clear thesis, tutorial, reflection, or experience
- be understandable
- cite sources, images, code, and inspirations when needed
- respect copyright and licenses
- avoid discriminatory, offensive, or harassing content
- avoid publishing personal data without consent
- not be pure self-promotion

## AI-assisted or generated articles

AI usage is allowed, but author is fully responsible for content.

If article was generated or heavily assisted by AI, add note such as:

```md
Editorial note: this article was written with AI support and reviewed by the author.
```

Articles must still be verified, original, relevant, and useful.

## Proposing code changes

Code PRs are distinct from article PRs.

Code/source PRs include, for example:

- changes to components, layout, build, routing, or rendering
- accessibility improvements
- bug fixes
- tests
- CI automation
- performance improvements
- source-related technical documentation
- refactoring

Not considered code PRs for maintainer path:

- new Markdown articles
- minor edits inside articles
- purely editorial content updates

## Review and voting

All pull requests must be reviewed.

### Article PRs

Article PRs are evaluated for:

- relevance
- content quality
- clarity
- Code of Conduct compliance
- copyright and sources
- moderation risks

Suggested rule:

- minimum quorum: 2 maintainers if team has up to 3 maintainers
- minimum quorum: 3 maintainers if team has more than 3 maintainers
- approval: simple majority of valid votes
- veto: only for safety, legal, copyright, moderation, or Code of Conduct reasons
- conflict of interest: author does not vote on their own PR

### Code PRs

Code PRs are evaluated for:

- correctness
- readability
- maintainability
- accessibility
- performance
- UX impact
- tests or manual verification
- consistency with project style

Suggested rule:

- at least 1 approval for small changes
- at least 2 approvals for structural changes
- at least 2 approvals for governance, security, license, or process changes
- no merge with failing checks, unless explicit maintainer decision

## Becoming a contributor

To become editorial contributor: at least 3 approved and published articles.

Maintainers may reject promotion if there are open violations, non-collaborative behavior, or trust concerns.

## Becoming a maintainer

To become maintainer: at least 3 approved and merged technical PRs on repository source code, excluding PRs that only affect Markdown articles.

In addition, person should show:

- constructive review skills
- process reliability
- trustworthiness
- attention to security and Code of Conduct
- willingness to support community operations

Nomination happens through maintainer vote.

## Checklist before PR

For articles:

- [ ] I read Code of Conduct
- [ ] I read Content Guidelines
- [ ] Content is relevant to blog
- [ ] I cited sources and references
- [ ] I checked links and images
- [ ] I disclosed relevant AI usage
- [ ] I accept review and change requests

For code:

- [ ] I explained problem solved
- [ ] I described approach
- [ ] I tested changes
- [ ] I considered accessibility and performance
- [ ] I updated docs/examples if needed
