import { type ButtplugClientDevice } from 'buttplug'
import { wait } from '../helpers/helpers'

export class Vibrator {
  active = false

  constructor(private readonly device: ButtplugClientDevice) {}

  async setVibration(intensity: number): Promise<void> {
    await this.device.vibrate(intensity)
  }

  async thump(timeout: number, intensity = 1): Promise<void> {
    if (!this.active) {
      this.active = true
      await this.device.vibrate(intensity)
      await wait(timeout)
      await this.device.stop()
      this.active = false
    } else {
      await wait(timeout)
    }
  }

  get name(): string {
    return this.device.name
  }
}
