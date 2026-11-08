import { css } from 'lit';

export const collapse = css`
  .collapse {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    visibility: hidden;
    transition:
      grid-template-rows 0.4s cubic-bezier(0.23, 1, 0.32, 1),
      opacity 0.4s cubic-bezier(0.23, 1, 0.32, 1),
      visibility 0s 0.4s;
  }

  .collapse > * {
    overflow: hidden;
    min-height: 0;
  }

  .collapse[open] {
    grid-template-rows: 1fr;
    opacity: 1;
    visibility: visible;
    transition-delay: 0s;
  }
`;
