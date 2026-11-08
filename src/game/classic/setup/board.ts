import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/slider/slider.js';
import { LitElement, html, css } from 'lit';
import '../../../elements/JoiDivider';
import '../../../elements/JoiFields';
import '../../../elements/JoiMeasure';
import '../../../elements/JoiRow';
import '../../../elements/JoiText';
import '../../../elements/JoiToggleTile';
import { Frames } from '../../../engine/Frames';
import { Document } from '../../../engine/plugins/Documents';
import { sdk } from '../../../engine/sdk';
import { displayKeys } from '../image';
import { imageKeys } from '../randomImages';
import { base } from '../../../elements/base';
import { defineElement } from '../../../engine/defineElement';

export const BOARD_SETTINGS_TAG = 'how-joi-classic-board-settings';

export class BoardSettingsElement extends LitElement {
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

  private display = Frames.watch<Document>(this, displayKeys.path);
  private images = Frames.watch<Document>(this, imageKeys.path);

  render() {
    const { highRes, videoSound } = displayKeys.from(this.display.value);
    const { imageDuration, intenseImages } = imageKeys.from(this.images.value);
    return html`
      <joi-fields label="Board">
        <joi-description>How the board is rendered</joi-description>
        <joi-toggle-tile
          .value=${highRes}
          @click=${() => sdk.inject(displayKeys.set('highRes', !highRes))}
        >
          <h6 class="subtitle">High resolution</h6>
          <p class="caption">Use high resolution images/videos</p>
          <span slot="trailing">${highRes ? '🦄' : '🐴'}</span>
        </joi-toggle-tile>
        <joi-space size="small"></joi-space>
        <joi-row>
          <joi-label>Image Duration</joi-label>
          <wa-slider
            min="10"
            max="60"
            step="1"
            .value=${imageDuration}
            @input=${(e: Event) =>
              sdk.inject(
                imageKeys.set(
                  'imageDuration',
                  Number((e.currentTarget as any).value)
                )
              )}
          ></wa-slider>
          <joi-measure .value=${imageDuration} chars="2" unit="s"></joi-measure>
        </joi-row>
        <joi-space size="small"></joi-space>
        <joi-toggle-tile
          .value=${intenseImages}
          @click=${() =>
            sdk.inject(imageKeys.set('intenseImages', !intenseImages))}
        >
          <h6>Intense images</h6>
          <p class="caption">Switch faster as intensity increases</p>
          <span slot="trailing">${intenseImages ? '⚡' : '🐌'}</span>
        </joi-toggle-tile>
        <joi-divider></joi-divider>
        <joi-toggle-tile
          .value=${videoSound}
          @click=${() => sdk.inject(displayKeys.set('videoSound', !videoSound))}
        >
          <h6>Video sound</h6>
          <p class="caption">Enable sound for videos</p>
          <span slot="trailing">
            <wa-icon
              name=${videoSound ? 'volume-high' : 'volume-xmark'}
            ></wa-icon>
          </span>
        </joi-toggle-tile>
      </joi-fields>
    `;
  }
}

defineElement(BOARD_SETTINGS_TAG, BoardSettingsElement);

declare global {
  interface HTMLElementTagNameMap {
    [BOARD_SETTINGS_TAG]: BoardSettingsElement;
  }
}
