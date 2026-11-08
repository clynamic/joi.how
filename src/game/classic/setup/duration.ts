import '@awesome.me/webawesome/dist/components/slider/slider.js';
import { LitElement, html, css } from 'lit';
import '../../../elements/JoiDivider';
import '../../../elements/JoiFields';
import '../../../elements/JoiMeasure';
import '../../../elements/JoiRow';
import '../../../elements/JoiText';
import { Frames } from '../../../engine/Frames';
import { Document } from '../../../engine/plugins/Documents';
import { sdk } from '../../../engine/sdk';
import { intensityKeys } from '../intensity';
import { warmupKeys } from '../warmup';
import { base } from '../../../elements/base';
import { defineElement } from '../../../engine/defineElement';

export const DURATION_SETTINGS_TAG = 'how-joi-classic-duration-settings';

const minutes = (seconds: number) => Math.ceil(seconds / 60);

export class DurationSettingsElement extends LitElement {
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

  private warmup = Frames.watch<Document>(this, warmupKeys.path);
  private intensity = Frames.watch<Document>(this, intensityKeys.path);

  render() {
    const { warmupDuration } = warmupKeys.from(this.warmup.value);
    const { gameDuration } = intensityKeys.from(this.intensity.value);
    return html`
      <joi-fields label="Duration">
        <joi-description>Determine game length</joi-description>
        <joi-info>Warmup period has no beats</joi-info>
        <joi-row>
          <label for="warmup-duration">Warmup duration</label>
          <wa-slider
            id="warmup-duration"
            min="0"
            max="300"
            step="60"
            .value=${warmupDuration}
            @input=${(e: Event) =>
              sdk.inject(
                warmupKeys.set(
                  'warmupDuration',
                  Number((e.currentTarget as any).value)
                )
              )}
          ></wa-slider>
          <joi-measure
            .value=${minutes(warmupDuration)}
            chars="2"
            unit="min"
          ></joi-measure>
        </joi-row>
        <joi-divider></joi-divider>
        <joi-info>A climax event will trigger roughly after this time</joi-info>
        <joi-row>
          <label for="session-duration">Session duration</label>
          <wa-slider
            id="session-duration"
            min="180"
            max="1800"
            step="60"
            .value=${gameDuration}
            @input=${(e: Event) =>
              sdk.inject(
                intensityKeys.set(
                  'gameDuration',
                  Number((e.currentTarget as any).value)
                )
              )}
          ></wa-slider>
          <joi-measure
            .value=${minutes(gameDuration)}
            chars="2"
            unit="min"
          ></joi-measure>
        </joi-row>
      </joi-fields>
    `;
  }
}

defineElement(DURATION_SETTINGS_TAG, DurationSettingsElement);

declare global {
  interface HTMLElementTagNameMap {
    [DURATION_SETTINGS_TAG]: DurationSettingsElement;
  }
}
