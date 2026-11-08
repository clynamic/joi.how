import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../messages/list';
import '../pause/menu';
import '../pause/countdown';
import './emergencyStop/button';
import './hypno/phrase';
import './image/backdrop';
import './instructions';
import './stroke/meter';
import { base } from '../../elements/base';

export const PLAY_TAG = 'how-joi-classic-play';

@customElement(PLAY_TAG)
export class ClassicPlayElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        position: relative;
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      .top,
      .bottom {
        position: absolute;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
      }

      .top {
        top: 0;
      }

      .bottom {
        bottom: 0;
        align-items: flex-end;
      }

      .top-left {
        margin-bottom: 8px;
      }

      .top-right,
      .bottom-right {
        margin-left: auto;
      }

      .center {
        position: relative;
      }

      .center-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        white-space: nowrap;
      }
    `,
  ];

  render() {
    return html`
      <how-joi-classic-backdrop></how-joi-classic-backdrop>
      <div class="top">
        <div class="top-left">
          <how-joi-classic-instructions></how-joi-classic-instructions>
        </div>
        <div class="top-right">
          <how-joi-messages></how-joi-messages>
        </div>
      </div>
      <div class="center">
        <how-joi-classic-meter></how-joi-classic-meter>
        <div class="center-overlay">
          <how-joi-classic-hypno></how-joi-classic-hypno>
        </div>
      </div>
      <div class="bottom">
        <how-joi-pause-menu></how-joi-pause-menu>
        <div class="bottom-right">
          <how-joi-classic-emergency-stop></how-joi-classic-emergency-stop>
        </div>
      </div>
      <how-joi-pause-countdown></how-joi-pause-countdown>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [PLAY_TAG]: ClassicPlayElement;
  }
}
