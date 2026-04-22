# Publishing Strategy

This strategy describes how to publish and promote dout.dev articles.

## Goals

Publishing should:

- highlight authors
- drive traffic to blog
- generate healthy discussions on GitHub Discussions
- create editorial continuity
- make dout.dev recognizable as a community/open blog
- support resharing on LinkedIn

## Core principle

Blog is primary source. LinkedIn is amplification channel.

When possible:

1. publish first on dout.dev
2. open or link article GitHub Discussion
3. publish LinkedIn launch post
4. reshare from author, maintainer, or community profiles
5. optionally publish follow-up post with takeaway, comments, or deeper angle

## Editorial flow

### 1. Proposal

Author opens PR with article.

PR should include:

- title
- description
- tags
- Markdown content
- sources
- AI note when relevant
- required assets

### 2. Review

Maintainers check:

- relevance
- quality
- Code of Conduct compliance
- copyright
- sources
- tone
- moderation sustainability

### 3. Voting

PR is voted according to `GOVERNANCE.md`.

### 4. Publication

After merge:

- article is published on blog
- GitHub Discussion is linked or created
- public link is added to PR or Discussion
- author is tagged when possible and desired

### 5. LinkedIn launch

Launch post should include:

- opening hook
- article problem/theme
- reason to read
- article link
- author mention
- invitation to discuss in GitHub Discussion
- essential hashtags

## Suggested cadence

To avoid burning review bandwidth:

- 1 or 2 articles per week as baseline
- maximum 3 per week when maintainer bandwidth exists
- avoid publication without moderation availability
- prioritize quality, variety, and relevance

## LinkedIn post types

### Short launch post

```md
New on dout.dev: [TITLE]

[1-2 lines about core problem or insight.]

Written by [AUTHOR], published through the community/open blog workflow.

Read it here:
[LINK]

Join the discussion on GitHub:
[DISCUSSION_LINK]

#WebDevelopment #OpenSource #Frontend
```

### Narrative launch post

```md
Some ideas deserve more than a quick comment.

[TITLE] starts from a simple point:
[INSIGHT]

But the interesting part is what happens next:
[TAKEAWAY 1]
[TAKEAWAY 2]
[TAKEAWAY 3]

This is why dout.dev exists:
an open mic for thoughtful, practical, community-driven writing about the web.

Article:
[LINK]

Discussion:
[DISCUSSION_LINK]
```

### Author post

```md
I just published a new article on dout.dev.

It is about [TOPIC], but the real point is [ANGLE].

I wrote it because [MOTIVATION].

Thanks to maintainers for review and to community for making this open publishing model possible.

Read it here:
[LINK]
```

### Maintainer post

```md
New community contribution on dout.dev.

[AUTHOR] wrote about [TOPIC], focused on [ANGLE].

What I like about it:
- [POINT 1]
- [POINT 2]
- [POINT 3]

Read article:
[LINK]

Comments are open through GitHub Discussions:
[DISCUSSION_LINK]
```

### Follow-up takeaway

```md
One takeaway from [TITLE]:

[QUOTE OR PARAPHRASE]

This matters because [WHY].

Full article on dout.dev:
[LINK]
```

## LinkedIn reposts

When resharing article on LinkedIn:

- do not copy full article if goal is blog traffic
- use extract, takeaway, or additional reflection
- keep blog link as primary source
- always credit author
- invite discussion on GitHub Discussion, not only LinkedIn comments

## Full republishing on LinkedIn

If full republish is chosen:

- publish first on dout.dev
- add top or bottom note linking original
- keep title and author consistent
- do not remove attributions or licenses
- evaluate canonical link or editorial note when platform allows

Suggested note:

```md
Originally published on dout.dev:
[LINK]
```

## Promotion roles

### Author

Can:

- share article
- explain motivation
- answer questions
- invite discussion

### Maintainer

Can:

- post from personal or official channels
- coordinate calendar
- moderate discussion
- highlight contribution value

### Community

Can:

- reshare
- comment
- ask questions
- suggest follow-ups

## Editorial calendar

Maintain board or recurring issue with:

- articles in review
- ready articles
- planned publication date
- author
- responsible maintainer
- discussion status
- LinkedIn post status
- planned follow-ups

## Useful metrics

Measure without reducing everything to vanity metrics.

Suggested metrics:

- published articles
- new authors
- promoted contributors
- useful comments in Discussions
- technical PRs opened by contributors
- traffic from LinkedIn
- meaningful saves/comments on LinkedIn
- post-publication updates
- issues or fixes generated from articles

## LinkedIn editorial style

Recommended tone:

- human
- technical
- direct
- curious
- non-corporate
- non-clickbait

Avoid:

- "You won't believe"
- engagement bait
- flame against technologies or communities
- hashtag overload
- irrelevant mentions
- posts without article/discussion links

## Content reuse

From each article you can derive:

- 1 launch post
- 1 takeaway post
- 1 carousel if visual topic
- 1 commented code snippet
- 1 open question for Discussion
- 1 follow-up article if discussion creates value

## Editorial calendar issue template

```md
# Publishing plan: [MONTH]

## Ready to publish

- [ ] [TITLE] by [AUTHOR], PR [LINK], date [DATE]

## In review

- [ ] [TITLE] by [AUTHOR], PR [LINK]

## LinkedIn posts

- [ ] Launch post
- [ ] Author repost
- [ ] Maintainer repost
- [ ] Follow-up takeaway

## Discussions to watch

- [ ] [DISCUSSION_LINK]

## Notes

-
```
