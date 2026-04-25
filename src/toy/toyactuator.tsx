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
  currentMinIntensity: number = 0;
  currentMaxIntensity: number = 1.0;
  intensityStepSize: number = 1;
  absMinIntensity: number = 0;
  absMaxIntensity: number = 1.0;

  constructor(attributes: GenericDeviceMessageAttributes) {
    super(attributes);
    this.intensityStepSize = 1.0 / attributes.StepCount;
  }

  setMode(newMode: VibrateMode) {
    this.mode = newMode;
  }

  setMinIntensity(newMin: number) {
    this.currentMinIntensity = newMin;
  }

  setMaxIntensity(newMax: number) {
    this.currentMaxIntensity = newMax;
  }

  override getOutput(stroke: Stroke, intensity: number) {
    let output = this.currentMinIntensity;
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
    const slope = this.currentMaxIntensity - this.currentMinIntensity;
    return this.currentMinIntensity + slope * input;
  }
}

export class LinearActuator
  extends ToyActuator
  implements LinearActuatorSettings
{
  mode: LinearMode = LinearMode.normal;
  currentMinPosition: number = 0;
  currentMaxPosition: number = 1.0;
  positionStepSize: number = 1;
  absMinPosition: number = 0;
  absMaxPosition: number = 1.0;

  constructor(attributes: GenericDeviceMessageAttributes) {
    super(attributes);
    this.positionStepSize = 1.0 / attributes.StepCount;

  }

  setMode(newMode: LinearMode) {
    this.mode = newMode;
  }

  setMinPosition(newMin: number) {
    this.currentMinPosition = newMin;
  }

  setMaxPosition(newMax: number) {
    this.currentMaxPosition = newMax;
  }

  override getOutput(stroke: Stroke, intensity: number, pace: number) {
    let targetPosition = this.currentMinPosition;
    let movementTime = Math.round(1000.0 / pace);
    switch (this.mode) {
      case LinearMode.normal:
        if (stroke == Stroke.up) {
          targetPosition = this.currentMaxPosition;
        }
        break;
      case LinearMode.inverted:
        if (stroke == Stroke.down) {
          targetPosition = this.currentMaxPosition;
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
  currentMinIntensity: number;
  currentMaxIntensity: number;
}

export interface LinearActuatorSettings {
  mode: LinearMode;
  currentMinPosition: number;
  currentMaxPosition: number;
}
