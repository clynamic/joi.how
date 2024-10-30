import { createStateProvider } from './state';
import { ButtplugClient, type ButtplugClientDevice } from 'buttplug';
import { type ToyActuator, VibrationActuator } from './toyactuator';

export class ToyClient {
  actuators: ToyActuator[] = [];

  constructor(private readonly device: ButtplugClientDevice) {
    device.vibrateAttributes.forEach(
      attribute =>
        (this.actuators = [...this.actuators, new VibrationActuator(attribute)])
    );
  }

  async setVibration(intensity: number | number[]): Promise<void> {
    await this.device.vibrate(intensity);
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
