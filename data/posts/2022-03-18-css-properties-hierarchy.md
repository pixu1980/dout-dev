---
title: CSS Properties Hierarchy
date: 2022-03-18
published: true
tags: ['HTML', 'CSS']
canonical_url: false
description: CSS Properties Hierarchy
---

```css
:root {
  --border-radius: 5px;
}

.element {
  /* css custom properties */
  --var--example: 1;
​
  /* position */
  position: absolute;
  inset: 0; /* top, right, bottom, left */
  z-index: 1;
​
  /* display */
  display: block;
  display: flex;
  place-content: center;
  place-items: center;
  justify-self: unset;
  gap: 1rem;

  opacity: 1;
  visibility: visible;
​
  /* box-model */
  box-sizing: border-box;
  width: 10rem;
  aspect-ratio: 16 / 9;
  padding: 1rem;
  border: 0.1rem solid black;
  border-radius: 0.4rem;
  margin: 1rem;
  outline: 0.3rem solid black;
  outline-offset: 0.3rem;
​
  /* colors & background */
  color: white;
  background-color: black;
  background-image: url();
  box-shadow: rgba(50, 50, 50, 1);
  filter: drop-shadow();
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
  appearance: none;
  cursor: pointer;
  pointer-event: none;
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
  /* pseudo selectors */
  &:hover {
  }
​
  /* media queries */
  @media screen and (width >= 1024px) {
    /* repeat css hierarchy here */
  }

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
