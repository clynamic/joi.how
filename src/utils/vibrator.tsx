import { createStateProvider } from './state';
import { ButtplugClient, type ButtplugClientDevice } from 'buttplug';
import { type ToyActuator, VibrationActuator } from './toyactuator';

export class Vibrator {
  actuators: ToyActuator[] = [];

  constructor(private readonly device: ButtplugClientDevice) {
    console.log(device.vibrateAttributes);
    device.vibrateAttributes.forEach(
      attribute =>
        (this.actuators = [...this.actuators, new VibrationActuator(attribute)])
    );
  }

  async setVibration(intensity: number | number[]): Promise<void> {
    console.log(`setting intensity to ${intensity}`);
    await this.device.vibrate(intensity);
    console.log(`finished setting intensity to ${intensity}`);
  }

  async stop() {
    await this.device.stop();
  }

  get name(): string {
    return this.device.name;
  }
}

export interface VibratorSettings {
  client: ButtplugClient;
  connection?: string;
  devices: Vibrator[];
  error?: string;
}

export const {
  Provider: VibratorProvider,
  useProvider: useVibrators,
  useProviderSelector: useVibratorValue,
} = createStateProvider<VibratorSettings>({
  defaultData: {
    client: new ButtplugClient('JOI.how'),
    devices: [],
  },
});
