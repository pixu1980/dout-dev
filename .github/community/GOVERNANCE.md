# Governance

This document describes how dout.dev makes decisions.

## Goal

dout.dev aims to be a sustainable, open, curated community/open blog. The project should allow anyone to propose articles and improvements, while protecting quality, safety, and community.

## Main roles

### Author

Person who proposes or publishes articles.

### Contributor

Person with at least 3 approved and published articles.

### Code contributor

Person with at least 1 merged technical PR.

### Maintainer

Person responsible for review, merge, voting, and moderation.

### Core maintainer

Optional role with additional responsibilities for access, security, and governance.

## Decision types

### Editorial decisions

About:

- publishing new articles
- updating or removing articles
- content relevance
- editorial calendar
- management of article-related Discussions

### Technical decisions

About:

- source code
- architecture
- build
- performance
- accessibility
- tests
- CI/CD
- content structure

### Governance decisions

About:

- Code of Conduct
- contributorship
- maintainer nomination
- security policy
- licenses
- voting process
- repository permissions

## Article PR voting

Each article PR must go through maintainer voting.

Evaluation criteria:

- relevance to blog
- editorial quality
- clarity
- originality
- source correctness
- Code of Conduct compliance
- no legal or copyright risk
- sustainable public discussion risk

Suggested rules:

- if active maintainers are 1 or 2, at least 1 approval required
- if active maintainers are 3, at least 2 valid votes required
- if active maintainers are more than 3, at least 3 valid votes required
- simple majority passes
- author does not vote on own PR
- maintainer can request changes instead of immediate vote
- veto valid only for Code of Conduct, safety, copyright, privacy, or legal risk

Possible outcomes:

- approved
- approved with minor changes
- changes requested
- closed as not relevant
- closed for policy violation

## Technical PR voting

Suggested rules:

- small changes: at least 1 approval
- major changes: at least 2 approvals
- governance, security, license, or permission changes: at least 2 approvals and no open veto
- risky changes: mandatory discussion before merge

A technical PR should not be merged if it:

- breaks build or tests
- clearly worsens accessibility or performance
- introduces known vulnerabilities
- does not explain solved problem
- bypasses prior governance decisions

## Veto

Veto is not for blocking personal preference.

Veto is allowed only for:

- Code of Conduct violation
- legal risk
- copyright violation
- security issues
- personal data exposure
- clear damage to community
- severe project breakage

Maintainer using veto must explain reason and suggest resolution path when possible.

## Conflict of interest

Maintainer must declare conflict when:

- they are PR author
- they work for directly involved entity
- they have relevant personal relationship with author
- they had recent conflict with author
- they could gain direct advantage from decision

With conflict, maintainer may discuss but should not vote.

## Contributor nomination

Person becomes contributor when:

- at least 3 articles are approved and published
- no open Code of Conduct violations
- collaborative behavior shown during reviews and Discussions

Promotion can be proposed by maintainer or requested by author.

## Maintainer nomination

A person can become maintainer when:

- at least 3 technical PRs are approved and merged
- PRs are not only Markdown articles
- reliability and project care are demonstrated
- participation in reviews/discussions is constructive
- person knows Code of Conduct, contributing flow, and governance

Process:

1. candidacy proposed in maintainer issue/discussion, if available
2. requirements verified
3. maintainers discuss
4. vote
5. result communicated
6. permissions and public docs updated if approved

Suggested rule:

- quorum: at least 2 active maintainers
- approval: simple majority
- veto allowed only for documented trust, security, or Code of Conduct reasons

## Maintainer inactivity

Maintainer can be considered inactive after 6 months without participation.

Possible actions:

- private check-in
- voluntary permission reduction
- move to maintainer emeritus
- revoke critical permissions

Goal is not punishment, but risk reduction and role clarity.

## Urgent decisions

For vulnerability, abuse, harmful content, or legal risk, maintainer can act immediately.

Possible urgent actions:

- close discussion
- hide comment
- block PR
- revert merge
- temporarily remove content
- limit account

Decision should be documented and reviewed by maintainers as soon as possible.

## Transparency

Decisions should be public when possible.

Exceptions:

- abuse reports
- personal data
- vulnerabilities
- private conflicts
- legal matters
- sensitive information

## Changing this governance

Changes to this document require:

- dedicated PR
- at least 2 maintainer approvals
- no open veto
- reasonable comment period when change affects contributors or authors
