---
title: You can use express tags… TODAY!
date: 2022-02-25
published: true
tags: ['HTML', 'CSS']
canonical_url: false
cover_image: ./images/svg-code.jpg
description: 'You can use express tags… TODAY!'
---

# You can use express tags… TODAY!

HTML6 is coming, we know it very well, 'cause we're strongly waiting for features like described [here](https://www.htmlgoodies.com/guides/expected-new-features-in-html6/).

## Let's take a look

Since the introduction of XHTML, naming tags anyway you want is possible and passes HTMl validators. Browser engines computes unknown element names as normal a `<div>`.

Which means you can code HTML like this:

```
<logo>
  <img src="http:/domain.ext/path/to/image.jpg" />
</logo>
```

Which also means you can code CSS (here SCSS) as this:

```
logo {
  width: 10rem;
  aspect-ratio: 2 / 1;

  img {
    width: 100%;
    object-fit: cover;
  }
}
```

<iframe height="300" style="width: 100%; min-height: 70rem;" scrolling="no" title="blog-2022-02-25-01" src="https://codepen.io/pixu1980/embed/LYOJpBz?default-tab=html%2Cresult&theme-id=dark" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
  See the Pen <a href="https://codepen.io/pixu1980/pen/LYOJpBz">
  blog-2022-02-25-01</a> by pixu1980 (<a href="https://codepen.io/pixu1980">@pixu1980</a>)
  on <a href="https://codepen.io">CodePen</a>.
</iframe>
