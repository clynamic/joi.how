import { createStateProvider } from './state';
import {
  ButtplugClient,
  type ButtplugClientDevice,
  ActuatorType,
} from 'buttplug';
import { ToyActuator, VibrationActuator, LinearActuator } from './toyactuator';
import { Stroke } from '../game/GameProvider';
import { wait } from '../utils';

export class ToyClient {
  actuators: ToyActuator[] = [];

  constructor(private readonly device: ButtplugClientDevice) {
    device.vibrateAttributes.forEach(
      attribute =>
        (this.actuators = [...this.actuators, new VibrationActuator(attribute)])
    );
    device.linearAttributes.forEach(
      attribute =>
        (this.actuators = [...this.actuators, new LinearActuator(attribute)])
    );
    device.oscillateAttributes.forEach(
      attribute =>
        (this.actuators = [...this.actuators, new ToyActuator(attribute)])
    );
    device.rotateAttributes.forEach(
      attribute =>
        (this.actuators = [...this.actuators, new ToyActuator(attribute)])
    );
  }

  async actuate(stroke: Stroke, intensity: number, pace: number) {
    const vibrationArray: number[] = [];
    const linearArray: [number, number][] = [];
    this.actuators.forEach(actuator => {
      switch (actuator.actuatorType) {
        case ActuatorType.Vibrate:
          vibrationArray[actuator.index] = actuator.getOutput?.(
            stroke,
            intensity,
            pace
          ) as number;
          break;
        case ActuatorType.Position:
          linearArray[actuator.index] = actuator.getOutput?.(
            stroke,
            intensity,
            pace
          ) as [number, number];
          break;
        default:
          break;
      }
    });
    if (vibrationArray.length > 0) {
      this.device.vibrate(vibrationArray);
    }
    if (linearArray.length > 0) {
      this.device.linear(linearArray);
    }
  }

  async climax() {
    for (let i = 0; i < 15; i++) {
      const strength = Math.max(0, 1 - i * 0.067);
      const vibrationArray: number[] = [];
      this.actuators.forEach(actuator => {
        switch (actuator.actuatorType) {
          case ActuatorType.Vibrate: {
            const vibrationActuator = actuator as VibrationActuator;
            vibrationArray[actuator.index] =
              vibrationActuator.mapToRange(strength);
            break;
          }
          default:
            break;
        }
        if (vibrationArray.length > 0) {
          this.device.vibrate(vibrationArray);
        }
      });
      await wait(400);
    }
  }

  async stop() {
    await this.device.stop();
  }

  get name(): string {
    return this.device.name;
  }
}

export interface ToyClientSettings {
  client: ButtplugClient;
  connection?: string;
  devices: ToyClient[];
  error?: string;
}

export const {
  Provider: ToyClientProvider,
  useProvider: useToyClients,
  useProviderSelector: useToyClientValue,
} = createStateProvider<ToyClientSettings>({
  defaultData: {
    client: new ButtplugClient('JOI.how'),
    devices: [],
  },
});
