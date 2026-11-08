import '@awesome.me/webawesome/dist/components/slider/slider.js';
import { LitElement, html, css, svg } from 'lit';
import '../../../elements/JoiDivider';
import '../../../elements/JoiFields';
import '../../../elements/JoiMeasure';
import '../../../elements/JoiRow';
import '../../../elements/JoiText';
import { Frames } from '../../../engine/Frames';
import { Document } from '../../../engine/plugins/Documents';
import { sdk } from '../../../engine/sdk';
import Pace, { paceGraphPoint } from '../pace';
import { base } from '../../../elements/base';
import { defineElement } from '../../../engine/defineElement';

export const PACE_SETTINGS_TAG = 'how-joi-classic-pace-settings';

const MIN_PACE = 0.25;
const MAX_PACE = 10;
const POINTS = 100;
const Y_TOP = 12;

type PaceKey = 'minPace' | 'maxPace' | 'steepness' | 'timeshift';

export class PaceSettingsElement extends LitElement {
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

      .chart {
        height: 100px;
        width: 100%;
      }

      svg {
        display: block;

        width: 100%;

        height: 100%;

        padding: 5px;

        box-sizing: border-box;

        overflow: visible;
      }

      .area {
        fill: var(--primary);

        fill-opacity: 0.3;
      }

      .curve {
        fill: none;

        stroke: var(--primary);

        stroke-width: 1;

        vector-effect: non-scaling-stroke;
      }

      .start {
        align-self: end;
      }

      .end {
        align-self: start;
      }
    `,
  ];

  private keys = Frames.watch<Document>(this, Pace.keys.path);

  private set(key: PaceKey) {
    return (event: Event) =>
      sdk.inject(
        Pace.keys.set(key, Number((event.currentTarget as any).value))
      );
  }

  private curve(steepness: number, timeshift: number) {
    const points = Array.from({ length: POINTS }, (_, index) =>
      paceGraphPoint(index / POINTS, steepness, timeshift, {
        min: MIN_PACE,
        max: MAX_PACE,
      })
    );
    const line = points
      .map(([x, y]) => `${x},${100 - (y / Y_TOP) * 100}`)
      .join(' L');
    const [lastX] = points[points.length - 1];
    return { curve: `M${line}`, area: `M${line} L${lastX},100 L0,100 Z` };
  }

  render() {
    const { minPace, maxPace, steepness, timeshift } = Pace.keys.from(
      this.keys.value
    );
    return html`
      <joi-fields label="Pace">
        <joi-description>Choose beat speed</joi-description>
        <joi-info>The game will run in beats per second (b/s)</joi-info>
        <joi-row>
          <joi-label>Minimum</joi-label>
          <wa-slider
            min=${MIN_PACE}
            max=${MAX_PACE}
            step="0.05"
            .value=${minPace}
            @input=${this.set('minPace')}
          ></wa-slider>
          <joi-measure .value=${minPace} chars="4" unit="b/s"></joi-measure>
        </joi-row>
        <joi-row>
          <joi-label>Maximum</joi-label>
          <wa-slider
            min=${MIN_PACE}
            max=${MAX_PACE}
            step="0.05"
            .value=${maxPace}
            @input=${this.set('maxPace')}
          ></wa-slider>
          <joi-measure .value=${maxPace} chars="4" unit="b/s"></joi-measure>
        </joi-row>
        <joi-divider></joi-divider>
        <joi-info
          >The random pace event will pick a pace from this curve</joi-info
        >
        <joi-row>
          <joi-label>Steepness</joi-label>
          <wa-slider
            min="0"
            max="1"
            step="0.05"
            .value=${steepness}
            @input=${this.set('steepness')}
          ></wa-slider>
          <joi-measure
            .value=${Math.floor(steepness * 100)}
            chars="3"
            unit="%"
          ></joi-measure>
        </joi-row>
        <joi-row>
          <joi-label>Timeshift</joi-label>
          <wa-slider
            min="0"
            max="1"
            step="0.05"
            .value=${timeshift}
            @input=${this.set('timeshift')}
          ></wa-slider>
          <joi-measure
            .value=${Math.floor(timeshift * 100)}
            chars="3"
            unit="%"
          ></joi-measure>
        </joi-row>
        <joi-space size="medium"></joi-space>
        <joi-row>
          <joi-label class="start">start</joi-label>
          <div class="chart">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              ${svg`<path class="area" d=${this.curve(steepness, timeshift).area} /><path class="curve" d=${this.curve(steepness, timeshift).curve} />`}
            </svg>
          </div>
          <joi-label class="end">end</joi-label>
        </joi-row>
      </joi-fields>
    `;
  }
}

defineElement(PACE_SETTINGS_TAG, PaceSettingsElement);

declare global {
  interface HTMLElementTagNameMap {
    [PACE_SETTINGS_TAG]: PaceSettingsElement;
  }
}
