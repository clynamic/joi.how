import { type GenericDeviceMessageAttributes, ActuatorType } from 'buttplug';
import { Stroke } from '../game/GameProvider';

export enum VibrateMode {
  alwaysOn = 'alwaysOn',
  alwaysOff = 'alwaysOff',
  activeUp = 'activeUp',
  activeDown = 'activeDown',
}

export enum LinearMode {
  alwaysOff = 'alwaysOff',
  normal = 'normal',
  inverted = 'inverted',
}

export const VibrateModeLabels: Record<VibrateMode, string> = {
  [VibrateMode.alwaysOn]: 'Always On',
  [VibrateMode.alwaysOff]: 'Always Off',
  [VibrateMode.activeUp]: 'Active on Upstroke',
  [VibrateMode.activeDown]: 'Active on Downstroke',
};

export const LinearModeLabels: Record<LinearMode, string> = {
  [LinearMode.alwaysOff]: 'Always Off',
  [LinearMode.normal]: 'Normal',
  [LinearMode.inverted]: 'Inverted',
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
  mode: VibrateMode = VibrateMode.activeUp;
  minIntensity: number = 0;
  maxIntensity: number = 1.0;
  intensityRange: number[] = [];

  constructor(attributes: GenericDeviceMessageAttributes) {
    super(attributes);
    const intensityStep = 1.0 / attributes.StepCount;
    for (let i = 0; i <= attributes.StepCount; ++i) {
      this.intensityRange[i] = intensityStep * i;
    }
  }

  setMode(newMode: VibrateMode) {
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
      case VibrateMode.activeUp:
        if (stroke == Stroke.up) {
          output = this.mapToRange(intensity / 100);
        }
        break;
      case VibrateMode.activeDown:
        if (stroke == Stroke.down) {
          output = this.mapToRange(intensity / 100);
        }
        break;
      case VibrateMode.alwaysOn:
        output = this.mapToRange(intensity / 100);
        break;
      case VibrateMode.alwaysOff:
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

export class LinearActuator
  extends ToyActuator
  implements LinearActuatorSettings
{
  mode: LinearMode = LinearMode.normal;
  minPosition: number = 0;
  maxPosition: number = 1.0;
  positionRange: number[] = [];

  constructor(attributes: GenericDeviceMessageAttributes) {
    super(attributes);
    const positionStep = 1.0 / attributes.StepCount;
    for (let i = 0; i <= attributes.StepCount; ++i) {
      this.positionRange[i] = positionStep * i;
    }
  }

  setMode(newMode: LinearMode) {
    this.mode = newMode;
  }

  setMinPosition(newMin: number) {
    this.minPosition = newMin;
  }

  setMaxPosition(newMax: number) {
    this.maxPosition = newMax;
  }

  override getOutput(stroke: Stroke, intensity: number, pace: number) {
    let targetPosition = this.minPosition;
    let movementTime = Math.round(1000.0 / pace);
    switch (this.mode) {
      case LinearMode.normal:
        if (stroke == Stroke.up) {
          targetPosition = this.maxPosition;
        }
        break;
      case LinearMode.inverted:
        if (stroke == Stroke.down) {
          targetPosition = this.maxPosition;
        }
        break;
      case LinearMode.alwaysOff:
        // multiply by intensity so we "use" the value
        // unsure if/how to use intensity in this function
        movementTime = 0 * intensity;
    }
    return [targetPosition, movementTime];
  }
}

export interface ToyActuatorSettings {
  index: number;
  actuatorType: ActuatorType;
}

export interface VibrationActuatorSettings {
  mode: VibrateMode;
  minIntensity: number;
  maxIntensity: number;
}

export interface LinearActuatorSettings {
  mode: LinearMode;
  minPosition: number;
  maxPosition: number;
}
