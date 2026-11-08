import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('joi-measure')
export class JoiMeasureElement extends LitElement {
  static styles = [
    css`
      :host {
        white-space: nowrap;
        font-family: 'Courier New', Courier, monospace;
        font-weight: var(--wa-font-weight-bold);
      }
    `,
  ];

  @property({ type: Number }) accessor value = 0;
  @property({ type: Number }) accessor chars = 2;
  @property({ type: String }) accessor unit = '';

  render() {
    const text = this.value
      .toString()
      .slice(0, this.chars)
      .padStart(this.chars, ' ');
    return html`${text} ${this.unit}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'joi-measure': JoiMeasureElement;
  }
}
