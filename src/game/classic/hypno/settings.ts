import '@awesome.me/webawesome/dist/components/icon/icon.js';
import { LitElement, html, css } from 'lit';
import '../../../elements/JoiFields';
import '../../../elements/JoiText';
import '../../../elements/JoiToggleTile';
import { Frames } from '../../../engine/Frames';
import { Document } from '../../../engine/plugins/Documents';
import { sdk } from '../../../engine/sdk';
import { base } from '../../../elements/base';
import { defineElement } from '../../../engine/defineElement';
import {
  GameHypnoDescriptions,
  GameHypnoLabels,
  GameHypnoType,
  hypnoKeys,
} from './index';

export const HYPNO_SETTINGS_TAG = 'how-joi-classic-hypno-settings';

const icons: Record<GameHypnoType, string> = {
  [GameHypnoType.off]: 'power-off',
  [GameHypnoType.joi]: 'otter',
  [GameHypnoType.breeding]: 'cow',
  [GameHypnoType.maledom]: 'dog',
  [GameHypnoType.femdom]: 'cat',
};

export class HypnoSettingsElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: flex;

        flex-direction: column;
      }
    `,
  ];

  private keys = Frames.watch<Document>(this, hypnoKeys.path);

  render() {
    const { hypno } = hypnoKeys.from(this.keys.value);
    return html`
      <joi-fields label="Hypno" role="radiogroup">
        <joi-description>Choose a hypno text set</joi-description>
        ${Object.values(GameHypnoType).map(
          current => html`
            <joi-toggle-tile
              type="radio"
              .value=${hypno === current}
              @change=${() => sdk.inject(hypnoKeys.set('hypno', current))}
            >
              <h6 class="subtitle">${GameHypnoLabels[current]}</h6>
              <p class="caption">${GameHypnoDescriptions[current]}</p>
              <span slot="trailing">
                <wa-icon name=${icons[current]}></wa-icon>
              </span>
            </joi-toggle-tile>
          `
        )}
      </joi-fields>
    `;
  }
}

defineElement(HYPNO_SETTINGS_TAG, HypnoSettingsElement);

declare global {
  interface HTMLElementTagNameMap {
    [HYPNO_SETTINGS_TAG]: HypnoSettingsElement;
  }
}
