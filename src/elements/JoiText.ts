import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('joi-description')
export class JoiDescriptionElement extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
        line-height: 1.1;
        margin: 10px 0;
      }
    `,
  ];

  render() {
    return html`<slot></slot>`;
  }
}

@customElement('joi-info')
export class JoiInfoElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: #9495ad;
      font-size: 0.8rem;
      font-style: italic;
      line-height: 1.1;
      margin: 10px 0;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'joi-description': JoiDescriptionElement;
    'joi-info': JoiInfoElement;
  }
}
