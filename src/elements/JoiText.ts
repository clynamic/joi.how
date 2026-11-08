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

@customElement('joi-label')
export class JoiLabelElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: #b9bad6;
      font-size: 0.9rem;
      font-weight: var(--wa-form-control-label-font-weight);
      line-height: var(--wa-form-control-label-line-height);
      white-space: nowrap;
      padding: 0 4px;
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
    'joi-label': JoiLabelElement;
  }
}
