import { type GenericDeviceMessageAttributes, ActuatorType } from 'buttplug';
import { createStateProvider } from './state';

export enum ActuatorMode {
  alwaysOn = 'alwaysOn',
  alwaysOff = 'alwaysOff',
  activeUp = 'activeUp',
  activeDown = 'activeDown',
}

export class ToyActuator {
  index: number;
  actuatorType: ActuatorType;
  intensity: number = 0;
  pace: number = 0;

  constructor(attributes: GenericDeviceMessageAttributes) {
    this.actuatorType = attributes.ActuatorType;
    this.index = attributes.Index;
  }
}

export class VibrationActuator extends ToyActuator {}

export interface ToyActuatorSettings {
  index: number;
  actuatorType: ActuatorType;
  mode: ActuatorMode;
}

export const {
  Provider: ActuatorProvider,
  useProvider: useActuator,
  useProviderSelector: useActuatorValue,
} = createStateProvider<ToyActuatorSettings>({
  defaultData: {
    index: -1,
    actuatorType: ActuatorType.Unknown,
    mode: ActuatorMode.activeUp,
  },
});
