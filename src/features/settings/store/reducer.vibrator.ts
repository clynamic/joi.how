import { Vibrator } from '../../../services/vibrator'
import {
  SettingsVibratorAction,
  T_VIBRATOR_TRY_TO_PAIR_FAIL,
  T_VIBRATOR_PAIRED,
  T_VIBRATOR_UNPAIRED,
  T_VIBRATOR_SET_MODE,
  VibrationStyleMode,
} from './actions.vibrator'

export interface ISettingsVibratorState {
  vibrator: Vibrator | null
  mode: VibrationStyleMode
  error: Error | null
}

export const SettingsVibratorDefaultState: ISettingsVibratorState = {
  vibrator: null,
  mode: VibrationStyleMode.CONSTANT,
  error: null,
}

export function SettingsVibratorReducer(
  state: ISettingsVibratorState = SettingsVibratorDefaultState,
  action: ReturnType<SettingsVibratorAction>,
): ISettingsVibratorState {
  switch (action.type) {
    case T_VIBRATOR_SET_MODE:
      return {
        ...state,
        mode: action.payload,
      }
    case T_VIBRATOR_TRY_TO_PAIR_FAIL:
      return {
        ...state,
        error: action.payload,
      }
    case T_VIBRATOR_UNPAIRED:
      return {
        ...state,
        vibrator: null,
      }
    case T_VIBRATOR_PAIRED:
      return {
        ...state,
        vibrator: action.payload,
      }
    default:
      return state
  }
}
