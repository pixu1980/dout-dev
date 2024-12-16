---
title: CSS Properties Hierarchy
date: 2022-03-18
published: true
tags: ['HTML', 'CSS']
canonical_url: false
description: CSS Properties Hierarchy
---

```css
.element {
  /* css custom properties */
  --var--example: 1;
​
  /* position */
  position: absolute;
​
  /* display */
  display: block;
  display: flex;
  justify-self: unset;
  opacity: 1;
​
  /* box-model */
  box-sizing: border-box;
  width: 10rem;
  aspect-ratio: 16 / 9;
  padding: 1rem;
  border: 0.1rem solid black;
  border-radius: 0.4rem;
  margin: 1rem;
​
  /* colors & background */
  color: white;
  background-color: black;
  background-image: url();
  box-shadow: rgba(50, 50, 50, 1);
​
  /* text */
  font-family: 'Courier New', Courier, monospace;
  font-size: 1rem;
  font-weight: 700;
  line-height: normal;
  white-space: nowrap;
  text-align: center;
  text-shadow: none;
​
  /* transform & animations */
  transform: translate();
  transition: opacity 300ms ease-in, width 500ms linear;
  will-change: opacity, width;
  animation: test 300ms forwards alternate-reverse;
​
  /* helpers */
  cursor: pointer;
  outline: 0;
  appearance: none;
  filter: drop-shadow();
​
  /* pseudo elements */
  &::after {
  }
​
  /* variants & pseudo selectors */
  &.error {
    color: red;
  }

  &[aria-hidden=true] {
    display: none;
  }
​
  &:hover {
  }
​
  /* sass includes */
  @include helpers.media($min-width: #{helpers.get-breakpoint-value(md)}) {
    display: none;
  }
​
  /* ------------ children */
  span {
    /* repeat css hierarchy here */
  }
​
  input {
    /* repeat css hierarchy here */
  }
​
  > * {
    /* repeat css hierarchy here */
  }
}
```
