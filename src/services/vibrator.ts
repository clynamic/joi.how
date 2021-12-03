import { ButtplugClientDevice } from 'buttplug'
import { wait } from '../features/gameboard/events/helpers'

export class Vibrator {
  active = false

  constructor(private device: ButtplugClientDevice) {}

  async setVibration(intensity: number) {
    return this.device.SendVibrateCmd(intensity)
  }

  async thump(timeout: number, intensity: number = 1) {
    if (!this.active) {
      this.active = true
      await this.device.SendVibrateCmd(intensity)
      await wait(timeout)
      await this.device.SendStopDeviceCmd()
      this.active = false
    } else {
      return wait(timeout)
    }
  }

  get name() {
    return this.device.Name
  }
}
