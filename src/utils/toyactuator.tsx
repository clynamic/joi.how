import { type GenericDeviceMessageAttributes, ActuatorType } from 'buttplug';

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
}

export class VibrationActuator
  extends ToyActuator
  implements VibrationActuatorSettings
{
  mode: ActuatorMode = ActuatorMode.activeUp;
  intensity: number = 0;

  setMode(newMode: ActuatorMode) {
    this.mode = newMode;
  }
}

export interface VibrationActuatorSettings {
  mode: ActuatorMode;
  intensity: number;
}

export interface ToyActuatorSettings {
  index: number;
  actuatorType: ActuatorType;
}
