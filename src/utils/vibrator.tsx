import { createStateProvider } from './state';
import { ButtplugClient, type ButtplugClientDevice } from 'buttplug';
import { wait } from './wait';

export enum VibrationMode {
  constant = 'constant',
  thump = 'thump',
}

export class Vibrator {
  private commandId = 0;

  constructor(private readonly device: ButtplugClientDevice) {}

  async setVibration(intensity: number): Promise<void> {
    ++this.commandId;
    await this.device.vibrate(intensity);
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
