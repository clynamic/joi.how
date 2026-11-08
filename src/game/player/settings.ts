import '@awesome.me/webawesome/dist/components/icon/icon.js';
import { LitElement, html, css } from 'lit';
import '../../elements/JoiDivider';
import '../../elements/JoiFields';
import '../../elements/JoiText';
import '../../elements/JoiToggleTile';
import { Frames } from '../../engine/Frames';
import { Document } from '../../engine/plugins/Documents';
import { sdk } from '../../engine/sdk';
import { base } from '../../elements/base';
import { defineElement } from '../../engine/defineElement';
import {
  PlayerBody,
  PlayerBodyDescriptions,
  PlayerBodyLabels,
  PlayerGender,
  PlayerGenderDescriptions,
  PlayerGenderLabels,
  playerKeys,
} from './index';

export const PLAYER_SETTINGS_TAG = 'how-joi-player-settings';

const genderIcons: Record<PlayerGender, string> = {
  [PlayerGender.male]: 'mars',
  [PlayerGender.female]: 'venus',
  [PlayerGender.other]: 'mars-and-venus',
};

const bodyIcons: Record<PlayerBody, string> = {
  [PlayerBody.penis]: '🍆',
  [PlayerBody.vagina]: '🍑',
  [PlayerBody.neuter]: '🥝',
};

export class PlayerSettingsElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: flex;

        flex-direction: column;
      }
    `,
  ];

  private keys = Frames.watch<Document>(this, playerKeys.path);

  render() {
    const { gender, body } = playerKeys.from(this.keys.value);
    return html`
      <joi-fields label="Player">
        <joi-description>Select your gender</joi-description>
        ${Object.values(PlayerGender).map(
          current => html`
            <joi-toggle-tile
              .value=${gender === current}
              @click=${() => sdk.inject(playerKeys.set('gender', current))}
            >
              <h6 class="subtitle">${PlayerGenderLabels[current]}</h6>
              <p class="caption">${PlayerGenderDescriptions[current]}</p>
              <p slot="trailing">
                <wa-icon name=${genderIcons[current]}></wa-icon>
              </p>
            </joi-toggle-tile>
          `
        )}
        <joi-divider></joi-divider>
        <joi-description>Select your body</joi-description>
        ${Object.values(PlayerBody).map(
          current => html`
            <joi-toggle-tile
              .value=${body === current}
              @click=${() => sdk.inject(playerKeys.set('body', current))}
            >
              <h6 class="subtitle2">${PlayerBodyLabels[current]}</h6>
              <p class="caption">${PlayerBodyDescriptions[current]}</p>
              <p slot="trailing">${bodyIcons[current]}</p>
            </joi-toggle-tile>
          `
        )}
      </joi-fields>
    `;
  }
}

defineElement(PLAYER_SETTINGS_TAG, PlayerSettingsElement);

declare global {
  interface HTMLElementTagNameMap {
    [PLAYER_SETTINGS_TAG]: PlayerSettingsElement;
  }
}
