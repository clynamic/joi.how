import { LitElement, html, css } from 'lit';
import { Frames } from '../../../engine/Frames';
import { climax, type ClimaxResultType } from './climax';
import { base } from '../../../elements/base';
import { defineElement } from '../../../engine/defineElement';

type OutcomeDisplay = { label: string; description: string };

const outcomes: Record<NonNullable<ClimaxResultType>, OutcomeDisplay> = {
  climax: { label: 'Climax', description: 'You came' },
  denied: { label: 'Denied', description: 'Better luck next time' },
  ruined: { label: 'Ruined', description: 'How unfortunate' },
};

const earlyEnd: OutcomeDisplay = { label: 'Ended early', description: '' };

export const RESULT_TAG = 'how-joi-dice-result';

export class DiceResultElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .label {
        font-size: 1.1rem;
        font-weight: bold;
        color: var(--text-color);
      }

      .description {
        font-size: 0.85rem;
        opacity: 0.6;
      }
    `,
  ];

  private result = Frames.watch(this, climax.result);

  render() {
    const display =
      (this.result.value && outcomes[this.result.value]) || earlyEnd;
    return html`
      <span class="label">${display.label}</span>
      ${display.description
        ? html`<span class="description">${display.description}</span>`
        : null}
    `;
  }
}

defineElement(RESULT_TAG, DiceResultElement);

declare global {
  interface HTMLElementTagNameMap {
    [RESULT_TAG]: DiceResultElement;
  }
}
