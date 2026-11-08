import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import { LitElement, html, css, nothing } from 'lit';
import { Frames } from '../../../engine/Frames';
import { sdk } from '../../../engine/sdk';
import Phase, { GamePhase, PhaseState } from '../../phase';
import EmergencyStop from './index';
import { base } from '../../../elements/base';
import { defineElement } from '../../../engine/defineElement';

export const EMERGENCY_STOP_TAG = 'how-joi-classic-emergency-stop';

export class ClassicEmergencyStopElement extends LitElement {
  static styles = [
    ...base,
    css`
      wa-button {
        --wa-form-control-height: 40px;
      }

      p {
        margin: 0;
      }
    `,
  ];

  private phase = Frames.watch<PhaseState>(this, Phase.paths);
  private modules = Frames.watch<string[]>(this, ['core.modules', 'order']);

  render() {
    if (!this.modules.value?.includes(EmergencyStop.id)) return nothing;
    if (this.phase.value?.current !== GamePhase.active) return nothing;
    return html`
      <wa-button
        size="large"
        variant="danger"
        @click=${() => sdk.inject(EmergencyStop.trigger())}
      >
        <p>Too close</p>
        <wa-icon slot="end" name="pause"></wa-icon>
      </wa-button>
    `;
  }
}

defineElement(EMERGENCY_STOP_TAG, ClassicEmergencyStopElement);

declare global {
  interface HTMLElementTagNameMap {
    [EMERGENCY_STOP_TAG]: ClassicEmergencyStopElement;
  }
}
