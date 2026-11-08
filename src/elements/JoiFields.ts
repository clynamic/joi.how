import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('joi-fields')
export class JoiFieldsElement extends LitElement {
  static styles = [
    css`
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      fieldset {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: var(--section-background);
        color: #b9bad6;
        border: unset;
        border-left: 2px solid var(--legend-background);
        border-radius: unset;
        margin: 0;
        padding: var(--wa-space-s);
        position: relative;
      }

      @media (max-width: 600px) {
        fieldset {
          padding: var(--wa-space-xs);
        }
      }

      legend {
        width: fit-content;
        font-weight: var(--wa-form-control-label-font-weight);
        padding: 4px 8px;
        background: var(--legend-background);
        color: var(--legend-color);
        line-height: 100%;
        font-size: 1rem;
      }

      .grid {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        column-gap: 1rem;
      }

      .grid ::slotted(:not(joi-row)) {
        grid-column: 1 / -1;
      }
    `,
  ];

  @property({ type: String }) accessor label = '';

  render() {
    return html`
      <fieldset>
        ${this.label || this.querySelector(':scope > [slot="legend"]')
          ? html`<legend part="legend">
              <slot name="legend">${this.label}</slot>
            </legend>`
          : nothing}
        <div class="grid"><slot></slot></div>
      </fieldset>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'joi-fields': JoiFieldsElement;
  }
}
