import '@awesome.me/webawesome/dist/components/slider/slider.js';
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../../../elements/JoiDivider';
import '../../../elements/JoiFields';
import '../../../elements/JoiMeasure';
import '../../../elements/JoiRow';
import '../../../elements/JoiText';
import { Frames } from '../../../engine/Frames';
import { Document } from '../../../engine/plugins/Documents';
import { sdk } from '../../../engine/sdk';
import { climaxKeys } from './climax';
import { base } from '../../../elements/base';

export const CLIMAX_SETTINGS_TAG = 'how-joi-dice-climax-settings';

const climaxText = (chance: number) => {
  if (chance === 100) return 'You will orgasm';
  if (chance === 0) return "You won't orgasm at all";
  return `${chance}% chance you'll orgasm`;
};

const ruinText = (chance: number) => {
  if (chance === 100) return 'You will have a ruined orgasm';
  if (chance === 0) return "You won't have a ruined orgasm";
  return `${chance}% chance you'll have a ruined orgasm`;
};

@customElement(CLIMAX_SETTINGS_TAG)
export class ClimaxSettingsElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: flex;

        flex-direction: column;
      }

      wa-slider {
        width: 100%;
      }
    `,
  ];

  private keys = Frames.watch<Document>(this, climaxKeys.path);

  private set(key: 'climaxChance' | 'ruinChance') {
    return (event: Event) =>
      sdk.inject(
        climaxKeys.set(key, Number((event.currentTarget as any).value))
      );
  }

  render() {
    const { climaxChance, ruinChance } = climaxKeys.from(this.keys.value);
    return html`
      <joi-fields label="Climax">
        <joi-description>At the game's climax...</joi-description>
        <joi-info>${climaxText(climaxChance)}</joi-info>
        <joi-row>
          <joi-label>Orgasm</joi-label>
          <wa-slider
            min="0"
            max="100"
            .value=${climaxChance}
            @input=${this.set('climaxChance')}
          ></wa-slider>
          <joi-measure .value=${climaxChance} chars="3" unit="%"></joi-measure>
        </joi-row>
        <joi-divider></joi-divider>
        <joi-description>Given an orgasm occurs...</joi-description>
        <joi-info>${ruinText(ruinChance)}</joi-info>
        <joi-row>
          <joi-label>Ruin</joi-label>
          <wa-slider
            min="0"
            max="100"
            .value=${ruinChance}
            @input=${this.set('ruinChance')}
          ></wa-slider>
          <joi-measure .value=${ruinChance} chars="3" unit="%"></joi-measure>
        </joi-row>
      </joi-fields>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [CLIMAX_SETTINGS_TAG]: ClimaxSettingsElement;
  }
}
