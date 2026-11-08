import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('joi-section')
export class JoiSectionElement extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
        background: var(--card-background);
        color: var(--card-color);
        border-radius: var(--border-radius);
        width: 100%;
        margin-bottom: 14px;
        padding: 10px 15px;
        box-sizing: border-box;
        font-size: 0.9rem;
        line-height: 25px;
        font-weight: normal;
      }

      @media (max-width: 600px) {
        :host {
          padding: var(--wa-space-2xs) var(--wa-space-xs);
          margin-bottom: var(--wa-space-xs);
        }
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'joi-section': JoiSectionElement;
  }
}
