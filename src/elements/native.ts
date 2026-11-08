import { css } from 'lit';

export const native = css`
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  hr,
  p,
  ul,
  ol {
    margin: 0;
  }

  :is(h1, h2, h3, h4, h5, h6, hr, p, ul, ol):has(+ *) {
    margin-block-end: var(--wa-content-spacing);
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: var(--wa-font-family-heading);
    font-weight: var(--wa-font-weight-heading);
    line-height: var(--wa-line-height-condensed);
    text-wrap: balance;
  }

  h1 {
    font-size: var(--wa-font-size-3xl);
  }

  h2 {
    font-size: var(--wa-font-size-2xl);
  }

  h3 {
    font-size: var(--wa-font-size-xl);
  }

  h4 {
    font-size: var(--wa-font-size-l);
  }

  h5 {
    font-size: var(--wa-font-size-m);
  }

  h6 {
    font-size: var(--wa-font-size-s);
  }

  p {
    text-wrap: pretty;
  }

  a {
    color: var(--wa-color-text-link);
  }
`;
