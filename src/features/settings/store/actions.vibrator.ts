import { ButtplugClient, ButtplugEmbeddedClientConnector, ButtplugClientDevice } from 'buttplug'
import { Thunk } from '../../../store.types'
import { Vibrator } from '../../../services/vibrator'

export const T_VIBRATOR_TRY_TO_PAIR_FAIL = 'VIBRATOR_TRY_TO_PAIR_FAILED'
export const T_VIBRATOR_PAIRED = 'VIBRATOR_PAIRED'
export const T_VIBRATOR_UNPAIRED = 'VIBRATOR_UNPAIRED'
export const T_VIBRATOR_SET_MODE = 'VIBRATOR_SET_MODE'

const client = new ButtplugClient('JOI.how Client')
const connector = new ButtplugEmbeddedClientConnector()

export class DeviceNotSupportedError extends Error {}

export enum VibrationStyleMode {
  THUMP,
  CONSTANT,
}

class SettingsVibratorActionsBase {
  TryToPair(): Thunk {
    return async dispatch => {
      client.removeAllListeners()
      client.addListener('deviceadded', (device: ButtplugClientDevice) => {
        if (device.AllowedMessages.indexOf('VibrateCmd') >= 0) {
          dispatch(this.Paired(device))
        } else {
          dispatch(this.PairFailed(new DeviceNotSupportedError()))
        }
      })

      try {
        await client.Connect(connector)
        await client.StartScanning()
      } catch (e) {
        dispatch(this.PairFailed(e))
      }
    }
  }

  TryToUnpair(): Thunk {
    return async dispatch => {
      await client.StopAllDevices()
      await client.Disconnect()
      dispatch(this.Unpaired())
    }
  }

  PairFailed = (error: Error) => ({
    type: T_VIBRATOR_TRY_TO_PAIR_FAIL as typeof T_VIBRATOR_TRY_TO_PAIR_FAIL,
    payload: error,
  })

  Paired = (device: ButtplugClientDevice | null) => ({
    type: T_VIBRATOR_PAIRED as typeof T_VIBRATOR_PAIRED,
    payload: !!device ? new Vibrator(device) : null,
  })

  Unpaired = () => ({
    type: T_VIBRATOR_UNPAIRED as typeof T_VIBRATOR_UNPAIRED,
  })

  SetMode = (mode: VibrationStyleMode) => ({
    type: T_VIBRATOR_SET_MODE as typeof T_VIBRATOR_SET_MODE,
    payload: mode,
  })
}

export const SettingsVibratorActions = new SettingsVibratorActionsBase()

export type SettingsVibratorAction =
  | SettingsVibratorActionsBase['PairFailed']
  | SettingsVibratorActionsBase['Paired']
  | SettingsVibratorActionsBase['Unpaired']
  | SettingsVibratorActionsBase['SetMode']
