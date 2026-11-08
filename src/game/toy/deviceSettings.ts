import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/slider/slider.js';
import { ActuatorType } from 'buttplug';
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { collapse } from '../../elements/collapse';
import '../../elements/JoiDivider';
import '../../elements/JoiFields';
import '../../elements/JoiRow';
import '../../elements/JoiText';
import {
  LinearActuator,
  LinearMode,
  LinearModeLabels,
  OscillateActuator,
  OscillateMode,
  OscillateModeLabels,
  ToyActuator,
  VibrateMode,
  VibrateModeLabels,
  VibrationActuator,
} from './actuator';
import { ToyClient } from './client';
import { base } from '../../elements/base';

export const TOY_DEVICE_TAG = 'how-joi-toy-device';
export const TOY_ACTUATOR_TAG = 'how-joi-toy-actuator';

const percent = (value: number) =>
  Intl.NumberFormat('en-US', { style: 'percent' }).format(value);

type Range = {
  description: string;
  rangeDescription: string;
  modes: Record<string, string>;
  mode: string;
  setMode: (mode: string) => void;
  min: number;
  max: number;
  absMin: number;
  absMax: number;
  step: number;
  setRange: (min: number, max: number) => void;
};

const describe = (actuator: ToyActuator): Range | null => {
  switch (actuator.actuatorType) {
    case ActuatorType.Vibrate: {
      const a = actuator as VibrationActuator;
      return {
        description: 'Select when this component will activate.',
        rangeDescription: 'Change the range of intensity for this component.',
        modes: VibrateModeLabels,
        mode: a.mode,
        setMode: mode => a.setMode(mode as VibrateMode),
        min: a.currentMinIntensity,
        max: a.currentMaxIntensity,
        absMin: a.absMinIntensity,
        absMax: a.absMaxIntensity,
        step: a.intensityStepSize,
        setRange: (min, max) => {
          a.setMinIntensity(min);
          a.setMaxIntensity(max);
        },
      };
    }
    case ActuatorType.Position: {
      const a = actuator as LinearActuator;
      return {
        description: 'Select when this component will activate.',
        rangeDescription: 'Change the range of motion for this component.',
        modes: LinearModeLabels,
        mode: a.mode,
        setMode: mode => a.setMode(mode as LinearMode),
        min: a.currentMinPosition,
        max: a.currentMaxPosition,
        absMin: a.absMinPosition,
        absMax: a.absMaxPosition,
        step: a.positionStepSize,
        setRange: (min, max) => {
          a.setMinPosition(min);
          a.setMaxPosition(max);
        },
      };
    }
    case ActuatorType.Oscillate: {
      const a = actuator as OscillateActuator;
      return {
        description: "Select how this component's speed will be calculated.",
        rangeDescription: 'Change the range of speed for this component.',
        modes: OscillateModeLabels,
        mode: a.mode,
        setMode: mode => a.setMode(mode as OscillateMode),
        min: a.currentMinSpeed,
        max: a.currentMaxSpeed,
        absMin: a.absMinSpeed,
        absMax: a.absMaxSpeed,
        step: a.speedStepSize,
        setRange: (min, max) => {
          a.setMinSpeed(min);
          a.setMaxSpeed(max);
        },
      };
    }
    default:
      return null;
  }
};

@customElement(TOY_ACTUATOR_TAG)
export class ToyActuatorElement extends LitElement {
  static styles = [
    ...base,
    collapse,
    css`
      :host {
        display: block;
      }

      wa-select {
        width: 100%;
      }
    `,
  ];

  @property({ attribute: false }) accessor actuator!: ToyActuator;

  @state() private accessor expanded = false;

  private onRange(range: Range, event: Event) {
    const slider = event.target as any;
    range.setRange(Number(slider.minValue), Number(slider.maxValue));
    this.requestUpdate();
  }

  render() {
    const range = describe(this.actuator);
    return html`
      <wa-button @click=${() => (this.expanded = !this.expanded)}>
        <wa-icon
          name=${this.expanded ? 'angle-down' : 'angle-right'}
          slot="start"
        ></wa-icon>
        ${this.actuator.actuatorType} ${this.actuator.index + 1}
      </wa-button>
      <div class="collapse" ?open=${this.expanded}>
        <div>
          ${range
            ? html`
                <joi-description>${range.description}</joi-description>
                <wa-select
                  value=${range.mode}
                  @input=${(e: Event) => {
                    range.setMode((e.currentTarget as any).value);
                    this.requestUpdate();
                  }}
                >
                  ${Object.entries(range.modes).map(
                    ([value, label]) =>
                      html`<wa-option value=${value}>${label}</wa-option>`
                  )}
                </wa-select>
                <joi-space size="medium"></joi-space>
                <joi-description>${range.rangeDescription}</joi-description>
                <wa-slider
                  range
                  with-tooltip
                  min=${range.absMin}
                  max=${range.absMax}
                  step=${range.step}
                  .minValue=${range.min}
                  .maxValue=${range.max}
                  .valueFormatter=${percent}
                  @input=${(e: Event) => this.onRange(range, e)}
                >
                  <span slot="reference">${range.absMin * 100}%</span>
                  <span slot="reference">${(range.absMax * 100) / 2}%</span>
                  <span slot="reference">${range.absMax * 100}%</span>
                </wa-slider>
              `
            : html`
                <joi-description>
                  This component is not currently supported.
                </joi-description>
              `}
          <joi-space size="small"></joi-space>
        </div>
      </div>
    `;
  }
}

@customElement(TOY_DEVICE_TAG)
export class ToyDeviceElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: block;
      }
    `,
  ];

  @property({ attribute: false }) accessor device!: ToyClient;

  render() {
    return html`
      <joi-fields label=${this.device.name}>
        <joi-description>
          Change the settings for each controllable component on your toy.
        </joi-description>
        ${this.device.actuators.map(
          actuator =>
            html`<how-joi-toy-actuator
              .actuator=${actuator}
            ></how-joi-toy-actuator>`
        )}
      </joi-fields>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [TOY_DEVICE_TAG]: ToyDeviceElement;
    [TOY_ACTUATOR_TAG]: ToyActuatorElement;
  }
}
