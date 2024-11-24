import { type GenericDeviceMessageAttributes, ActuatorType } from 'buttplug';
import { Stroke } from '../game/GameProvider';

export enum ActuatorMode {
  alwaysOn = 'alwaysOn',
  alwaysOff = 'alwaysOff',
  activeUp = 'activeUp',
  activeDown = 'activeDown',
}

export const ActuatorModeLabels: Record<ActuatorMode, string> = {
  [ActuatorMode.alwaysOn]: 'Always On',
  [ActuatorMode.alwaysOff]: 'Always Off',
  [ActuatorMode.activeUp]: 'Active on Upstroke',
  [ActuatorMode.activeDown]: 'Active on Downstroke',
};

export class ToyActuator implements ToyActuatorSettings {
  index: number;
  actuatorType: ActuatorType;

  constructor(attributes: GenericDeviceMessageAttributes) {
    this.actuatorType = attributes.ActuatorType;
    this.index = attributes.Index;
  }

  getOutput?(stroke: Stroke, intensity: number, pace: number): unknown;
}

export class VibrationActuator
  extends ToyActuator
  implements VibrationActuatorSettings
{
  mode: ActuatorMode = ActuatorMode.activeUp;
  minIntensity: number = 0;
  maxIntensity: number = 1.0;
  intensityRange: number[] = [];

  constructor(attributes: GenericDeviceMessageAttributes) {
    super(attributes);
    const intensityStep = 100 / attributes.StepCount / 100.0;
    for (let i = 0; i <= attributes.StepCount; ++i) {
      this.intensityRange[i] = intensityStep * i;
    }
  }

  setMode(newMode: ActuatorMode) {
    this.mode = newMode;
  }

  setMinIntensity(newMin: number) {
    this.minIntensity = newMin;
  }

  setMaxIntensity(newMax: number) {
    this.maxIntensity = newMax;
  }

  override getOutput(stroke: Stroke, intensity: number) {
    let output = this.minIntensity;
    switch (this.mode) {
      case ActuatorMode.activeUp:
        if (stroke == Stroke.up) {
          output = this.mapToRange(intensity / 100);
        }
        break;
      case ActuatorMode.activeDown:
        if (stroke == Stroke.down) {
          output = this.mapToRange(intensity / 100);
        }
        break;
      case ActuatorMode.alwaysOn:
        output = this.mapToRange(intensity / 100);
        break;
      case ActuatorMode.alwaysOff:
        output = 0;
        break;
    }
    return output;
  }

  mapToRange(input: number): number {
    const slope = this.maxIntensity - this.minIntensity;
    return this.minIntensity + slope * input;
  }
}

export interface VibrationActuatorSettings {
  mode: ActuatorMode;
  minIntensity: number;
  maxIntensity: number;
}

export interface ToyActuatorSettings {
  index: number;
  actuatorType: ActuatorType;
}
