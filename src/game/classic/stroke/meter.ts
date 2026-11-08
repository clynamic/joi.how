import { LitElement, html, css, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { Frames } from '../../../engine/Frames';
import Phase, { GamePhase, PhaseState } from '../../phase';
import Pace, { PaceState } from '../pace';
import Stroke, { StrokeDirection, StrokeState } from './index';
import { base } from '../../../elements/base';
import { defineElement } from '../../../engine/defineElement';

export const METER_TAG = 'how-joi-classic-meter';

export class ClassicMeterElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: block;
        pointer-events: none;
      }

      .circle {
        --spring: linear(
          0,
          0.39 16%,
          0.94 33%,
          1.045 50%,
          1.02 66%,
          0.998 83%,
          1
        );
        aspect-ratio: 1;
        width: 250px;
        border-radius: 100%;
        opacity: 0.3;
        border: 1px solid #000;
        transition:
          transform var(--duration) var(--spring),
          background-color var(--duration) var(--spring);
      }
    `,
  ];

  private stroke = Frames.watch<StrokeState>(this, Stroke.paths);
  private phase = Frames.watch<PhaseState>(this, Phase.paths);
  private pace = Frames.watch<PaceState>(this, Pace.paths);

  render() {
    if (!this.stroke.value) return nothing;
    const stroke = this.stroke.value.stroke;
    const phase = this.phase.value?.current;
    const pace = this.pace.value?.pace ?? 0;
    const active = phase === GamePhase.active || phase === GamePhase.finale;
    const switchDuration = pace > 0 ? (1 / pace) * 1000 : 0;
    const size = active ? (stroke === StrokeDirection.up ? 1 : 0.6) : 0;
    const duration = active ? (pace >= 5 ? 100 : pace >= 3 ? 250 : 550) : 0;
    const color =
      stroke === StrokeDirection.up
        ? 'rgb(179, 179, 179)'
        : 'rgb(114, 114, 114)';
    const span = Math.min(switchDuration, duration);
    return html`
      <div
        class="circle"
        style=${styleMap({
          '--duration': `${span}ms`,
          transform: `scale(${size})`,
          backgroundColor: color,
        })}
      ></div>
    `;
  }
}

defineElement(METER_TAG, ClassicMeterElement);

declare global {
  interface HTMLElementTagNameMap {
    [METER_TAG]: ClassicMeterElement;
  }
}
