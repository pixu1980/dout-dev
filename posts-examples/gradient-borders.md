---
title: Testing CodePen
date: 2021-03-05
published: true
tags: ['Markdown', 'Cover Image']
series: true
cover_image: ./images/alexandr-podvalny-220262-unsplash.jpg
canonical_url: false
description: "Markdown is intended to be as easy-to-read and easy-to-write as is feasible. Readability, however, is emphasized above all else. A Markdown-formatted document should be publishable as-is, as plain text, without looking like it's been marked up with tags or formatting instructions."
---

<style>
  .white-grad {
    --b: 5px; /* border width*/
    --r: 15px; /* the radius */

    color: var(--base-color-primary);
    padding: calc(var(--b) + 5px);
    display: inline-block;
    margin: 75px 0;
    position: relative;
    z-index: 0;
  }
  .white-grad:before {
    content: '';
    position: absolute;
    z-index: -1;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: var(--b);
    border: var(--b) solid transparent;
    border-radius: var(--r);
    background: linear-gradient(var(--base-background-color-primary), var(--base-background-color-primary)) padding-box,
      var(--c, linear-gradient(to right, #9c20aa, #fb3570)) border-box;
      
    // background: var(--c, linear-gradient(to right, #9c20aa, #fb3570));
    // -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    // mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    // -webkit-mask-composite: destination-out;
    // mask-composite: exclude;
  }
</style>
<div class="white-grad">Some text here</div>
<div class="white-grad" style="--r: 20px; --b: 10px; --c: linear-gradient(140deg, red, yellow, green)">
  Some long long long text here
</div>
<div class="white-grad" style="--r: 30px; --b: 8px; --c: linear-gradient(-40deg, black 50%, blue 0)">
  Some long long <br />long text here
</div>
<div class="white-grad" style="--r: 40px; --b: 20px; --c: conic-gradient(black, orange, purple)">
  Some long long <br />long text here<br />
  more and more more and more
</div>
<div class="white-grad" style="--r: 50%; --b: 10px; --c: linear-gradient(140deg, red, yellow, green)"></div>
<div class="white-grad" style="--r: 50%; --b: 8px; --c: linear-gradient(-40deg, black 50%, blue 0)"></div>
<div class="white-grad" style="--r: 50%; --b: 20px; --c: conic-gradient(black, orange, purple)"></div>
<div class="white-grad" style="--r: 50% 0 50% 50%"></div>
<div class="white-grad" style="--b: 10px; --r: 50% 0; --c: linear-gradient(140deg, red, yellow, green)"></div>
<div class="white-grad" style="--b: 8px; --r: 50% 0 0; --c: linear-gradient(-40deg, black 50%, blue 0)"></div>
<div class="white-grad" style="--b: 20px; --r: 50% 50% 0 0; --c: conic-gradient(black, orange, purple)"></div>
<div class="white-grad" style="--b: 0 0 20px 20px; --r: 50% 0 50% 50%"></div>
<div
  class="white-grad"
  style="--b: 10px 0 10px 0; --r: 50% 0; --c: linear-gradient(140deg, red, yellow, green)"
></div>
<div
  class="white-grad"
  style="--b: 8px 0px 0px 8px; --r: 50% 0 0; --c: linear-gradient(40deg, black 50%, blue 0)"
></div>
<div
  class="white-grad"
  style="--b: 20px 20px 0 20px; --r: 50% 50% 0 0; --c: conic-gradient(pink, orange, red, pink)"
></div>
