import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('joi-divider')
export class JoiDividerElement extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
        width: 24px;
        color: gray;
        margin: 1rem auto;
        border-top: 1px solid currentColor;
      }
    `,
  ];

  render() {
    return html``;
  }
}

export type JoiSpaceSize =
  | 'smallest'
  | 'small'
  | 'medium'
  | 'large'
  | 'largest';

const spaces: Record<JoiSpaceSize, string> = {
  smallest: 'var(--wa-space-2xs)',
  small: 'var(--wa-space-xs)',
  medium: 'var(--wa-space-m)',
  large: 'var(--wa-space-xl)',
  largest: 'var(--wa-space-4xl)',
};

@customElement('joi-space')
export class JoiSpaceElement extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
  `;

  @property({ type: String, reflect: true }) accessor size: JoiSpaceSize =
    'small';

  updated() {
    this.style.width = spaces[this.size];
    this.style.height = spaces[this.size];
  }

  render() {
    return html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'joi-divider': JoiDividerElement;
    'joi-space': JoiSpaceElement;
  }
}
