import { ButtplugClientDevice } from 'buttplug'
import { wait } from '../features/gameboard/events/helpers'

export class Vibrator {
  active = false

  constructor(private device: ButtplugClientDevice) {}

  async setVibration(intensity: number) {
    return this.device.vibrate(intensity)
  }

  async thump(timeout: number, intensity: number = 1) {
    if (!this.active) {
      this.active = true
      await this.device.vibrate(intensity)
      await wait(timeout)
      await this.device.stop()
      this.active = false
    } else {
      return wait(timeout)
    }
  }

  get name() {
    return this.device.name
  }
}
