# Maintainer Vote Examples

Practical PR voting examples.

## Example 1 - New article approved

Active maintainers: 3

| Maintainer | Vote |
| --- | --- |
| A | approve |
| B | approve |
| C | no vote |

Result: approved.

## Example 2 - Article with changes requested

Active maintainers: 4

| Maintainer | Vote |
| --- | --- |
| A | changes |
| B | approve |
| C | changes |

Result: changes requested. PR remains open.

## Example 3 - Copyright veto

Active maintainers: 4

| Maintainer | Vote |
| --- | --- |
| A | approve |
| B | approve |
| C | veto copyright |

Result: blocked until issue is fixed.

Veto must specify problematic content and required change.

## Example 4 - Maintainer candidacy

Requirements:

- 3 merged technical PRs
- no open violations
- collaborative behavior

Votes:

| Maintainer | Vote |
| --- | --- |
| A | approve |
| B | approve |
| C | abstain |

Result: candidacy approved.
