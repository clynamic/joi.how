import { LitElement, html, css } from 'lit';
import '../../../elements/JoiFields';
import '../../../elements/JoiText';
import '../../../elements/JoiToggleTile';
import { Frames } from '../../../engine/Frames';
import { Document } from '../../../engine/plugins/Documents';
import { sdk } from '../../../engine/sdk';
import { DiceEvent, DiceEventDescriptions, DiceEventLabels } from './events';
import { dealerKeys } from './index';
import { base } from '../../../elements/base';
import { defineElement } from '../../../engine/defineElement';

export const DICE_SETTINGS_TAG = 'how-joi-dice-settings';

export class DiceSettingsElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: flex;

        flex-direction: column;
      }
    `,
  ];

  private keys = Frames.watch<Document>(this, dealerKeys.path);

  private toggle(events: DiceEvent[], event: DiceEvent) {
    const next = events.includes(event)
      ? events.filter(e => e !== event)
      : [...events, event];
    sdk.inject(dealerKeys.set('events', next));
  }

  render() {
    const { events } = dealerKeys.from(this.keys.value);
    return html`
      <joi-fields label="Events">
        <joi-description>
          Check the events you want to occur during the game
        </joi-description>
        ${Object.values(DiceEvent).map(
          event => html`
            <joi-toggle-tile
              type="check"
              .value=${events.includes(event)}
              @click=${() => this.toggle(events, event)}
            >
              <h6 class="subtitle">${DiceEventLabels[event]}</h6>
              <p class="caption">${DiceEventDescriptions[event]}</p>
            </joi-toggle-tile>
          `
        )}
      </joi-fields>
    `;
  }
}

defineElement(DICE_SETTINGS_TAG, DiceSettingsElement);

declare global {
  interface HTMLElementTagNameMap {
    [DICE_SETTINGS_TAG]: DiceSettingsElement;
  }
}
