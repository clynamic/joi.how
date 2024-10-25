import { createStateProvider } from './state';
import { ButtplugClient, type ButtplugClientDevice } from 'buttplug';
import { wait } from './wait';
import { type ToyActuator, VibrationActuator } from './toyactuator';

export enum VibrationMode {
  constant = 'constant',
  thump = 'thump',
}

export class Vibrator {
  private commandId = 0;
  actuators: ToyActuator[] = [];

  constructor(private readonly device: ButtplugClientDevice) {
    console.log(device.vibrateAttributes);
    device.vibrateAttributes.forEach(
      attribute =>
        (this.actuators = [...this.actuators, new VibrationActuator(attribute)])
    );
  }

  async setVibration(intensity: number | number[]): Promise<void> {
    ++this.commandId;
    console.log(`setting intensity to ${intensity}`);
    await this.device.vibrate(intensity);
    console.log(`finished setting intensity to ${intensity}`);
  }

  async thump(timeout: number, intensity = 1): Promise<void> {
    const id = ++this.commandId;
    await this.device.vibrate(intensity);
    await wait(timeout);
    if (id === this.commandId) {
      await this.device.stop();
    }
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
