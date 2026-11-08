import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('joi-row')
export class JoiRowElement extends LitElement {
  static styles = [
    css`
      :host {
        display: contents;
      }

      :host([count='1']) ::slotted(*) {
        grid-column: 1 / -1;
      }

      :host([count='2']) ::slotted(:first-child) {
        grid-column: 1;
      }

      :host([count='2']) ::slotted(:nth-child(2)) {
        grid-column: 2 / -1;
      }
    `,
  ];

  @property({ type: Number, reflect: true }) accessor count = 0;

  private onSlotChange(event: Event) {
    const slot = event.target as HTMLSlotElement;
    const count = slot.assignedElements().length;
    if (count > 3) throw new Error('joi-row supports a maximum of 3 children.');
    this.count = count;
  }

  render() {
    return html`<slot @slotchange=${this.onSlotChange}></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'joi-row': JoiRowElement;
  }
}
