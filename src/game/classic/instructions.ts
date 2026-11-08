import '@awesome.me/webawesome/dist/components/divider/divider.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import { LitElement, html, css, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { Frames } from '../../engine/Frames';
import { Document } from '../../engine/plugins/Documents';
import { Paws, PawLabels, pawsPath, dealerKeys } from './dice';
import { DiceEvent } from './dice/events';
import Intensity, { IntensityState } from './intensity';
import Pace, { PaceState } from './pace';
import { base } from '../../elements/base';

export const INSTRUCTIONS_TAG = 'how-joi-classic-instructions';

@customElement(INSTRUCTIONS_TAG)
export class ClassicInstructionsElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: flex;
        height: fit-content;
        padding: 8px;
        background-color: var(--overlay-background);
        color: var(--overlay-color);
        border-bottom-right-radius: var(--border-radius);
      }

      .pace {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        justify-items: center;
      }

      .grip {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        justify-items: center;
      }

      .icon {
        color: rgba(255, 255, 255, 0.3);
        transition: color 0.2s;
        font-size: 2rem;
        padding: 0 4px;
      }

      .icon wa-icon {
        width: auto;
      }

      .icon wa-icon::part(svg) {
        width: auto;
        height: 1em;
      }

      .icon.active {
        color: #fff;
      }

      .info {
        color: #fff;
        font-size: 1rem;
        padding: 0 4px;
        grid-column: 1 / -1;
      }

      wa-divider {
        align-self: center;
      }

      .intensity {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .bar {
        flex: 1;
        width: 8px;
        background-color: rgba(255, 255, 255, 0.3);
        border-radius: var(--border-radius);
        position: relative;
        overflow: hidden;
      }

      .fill {
        position: absolute;
        bottom: 0;
        width: 100%;
        background-color: #fff;
        transition: height 0.5s;
      }
    `,
  ];

  private pace = Frames.watch<PaceState>(this, Pace.paths);
  private paceKeys = Frames.watch<Document>(this, Pace.keys.path);
  private paws = Frames.watch<Paws>(this, pawsPath);
  private intensity = Frames.watch<IntensityState>(this, Intensity.paths);
  private dealer = Frames.watch<Document>(this, dealerKeys.path);

  render() {
    if (!this.pace.value) return nothing;
    const pace = this.pace.value.pace ?? 0;
    const { maxPace } = Pace.keys.from(this.paceKeys.value);
    const section = maxPace / 3;
    const paws = this.paws.value ?? Paws.both;
    const { events } = dealerKeys.from(this.dealer.value);
    const randomGrip = events.includes(DiceEvent.randomGrip);
    const intensity = this.intensity.value?.intensity ?? 0;
    const heat = 255 - intensity * 255;

    return html`
      <div class="pace">
        <div class=${classMap({ icon: true, active: pace <= section })}>
          <wa-icon name="person"></wa-icon>
        </div>
        <div
          class=${classMap({
            icon: true,
            active: pace > section && pace <= section * 2,
          })}
        >
          <wa-icon name="person-walking"></wa-icon>
        </div>
        <div class=${classMap({ icon: true, active: pace > section * 2 })}>
          <wa-icon name="person-running"></wa-icon>
        </div>
        <div class="info">
          <strong>${parseFloat(pace.toFixed(2))}</strong> b/s
        </div>
      </div>
      ${randomGrip
        ? html`
            <wa-divider orientation="vertical"></wa-divider>
            <div class="grip">
              <div
                class=${classMap({
                  icon: true,
                  active: paws === Paws.left || paws === Paws.both,
                })}
              >
                <wa-icon name="hand" style="transform: scaleX(-1)"></wa-icon>
              </div>
              <div
                class=${classMap({
                  icon: true,
                  active: paws === Paws.right || paws === Paws.both,
                })}
              >
                <wa-icon name="hand"></wa-icon>
              </div>
              <div class="info"><strong>${PawLabels[paws]}</strong></div>
            </div>
          `
        : nothing}
      <div class="intensity">
        <div class="bar">
          <div
            class="fill"
            style="height: ${Math.round(intensity * 100)}%"
          ></div>
        </div>
        <wa-icon
          name="fire"
          style="color: rgb(255, ${heat}, ${heat})"
        ></wa-icon>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [INSTRUCTIONS_TAG]: ClassicInstructionsElement;
  }
}
