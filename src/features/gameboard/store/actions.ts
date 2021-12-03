import { Message } from '../MessageArea/MessageTypes'
import { EGrip } from '../types'
import { Thunk } from '../../../store.types'
import { VibrationStyleMode } from '../../settings/store'

export const T_SET_PACE = 'SET_PACE'
export const T_SET_GRIP = 'SET_GRIP'
export const T_SHOW_MESSAGE = 'SHOW_MESSAGE'
export const T_PULSE = 'PULSE'
export const T_INC_INTENSITY = 'INC_INTENSITY'
export const T_DEC_INTENSITY = 'DEC_INTENSITY'
export const T_CUM = 'CUM'
export const T_PAUSE_EVENTS = 'PAUSE_EVENTS'
export const T_RESUME_EVENTS = 'RESUME_EVENTS'
export const T_PAUSE_GAME = 'PAUSE_GAME'
export const T_RESUME_GAME = 'RESUME_GAME'
export const T_SET_VIBRATION = 'SET_VIBRATION'

class GameBoardActionsBase {
  SetPace(newPace: number): Thunk {
    return (dispatch, state) => {
      dispatch({
        type: T_SET_PACE as typeof T_SET_PACE,
        payload: newPace,
      })

      if (newPace > 9) dispatch(this.IncIntensity(8))
      else if (newPace > 8) dispatch(this.IncIntensity(4))
      else if (newPace > 7) dispatch(this.IncIntensity(2))
      else if (newPace > 6) dispatch(this.IncIntensity(1))
      else if (newPace < 3) dispatch(this.DecIntensity(1))
      else if (newPace < 2) dispatch(this.DecIntensity(2))
      else if (newPace < 1) dispatch(this.DecIntensity(12))
      else if (newPace < 0.5) dispatch(this.DecIntensity(18))
    }
  }

  SetGrip = (newGrip: EGrip) => ({
    type: T_SET_GRIP as typeof T_SET_GRIP,
    payload: newGrip,
  })

  ShowMessage = (message: Message) => ({
    type: T_SHOW_MESSAGE as typeof T_SHOW_MESSAGE,
    payload: message,
  })

  Pulse = () => ({
    type: T_PULSE as typeof T_PULSE,
  })

  PauseEvents = () => ({
    type: T_PAUSE_EVENTS as typeof T_PAUSE_EVENTS,
  })

  ResumeEvents = () => ({
    type: T_RESUME_EVENTS as typeof T_RESUME_EVENTS,
  })

  PauseGame = () => ({
    type: T_PAUSE_GAME as typeof T_PAUSE_GAME,
  })

  ResumeGame = () => ({
    type: T_RESUME_GAME as typeof T_RESUME_GAME,
  })

  IncIntensity = (addedIntensity: number) => ({
    type: T_INC_INTENSITY as typeof T_INC_INTENSITY,
    payload: addedIntensity,
  })

  DecIntensity = (removedIntensity: number) => ({
    type: T_DEC_INTENSITY as typeof T_DEC_INTENSITY,
    payload: removedIntensity,
  })

  Cum = () => ({
    type: T_CUM as typeof T_CUM,
  })

  SetVibration(percentage: number): Thunk {
    return (dispatch, state) => {
      const stateSnapshot = state()
      if (stateSnapshot.vibrator.mode === VibrationStyleMode.CONSTANT) {
        if (stateSnapshot.vibrator.vibrator) {
          stateSnapshot.vibrator.vibrator.setVibration(percentage).catch(error => {
            dispatch({
              type: T_SET_VIBRATION,
              payload: stateSnapshot.game.vibration,
            })
          })
        }
        dispatch({
          type: T_SET_VIBRATION,
          payload: percentage,
        })
      }
    }
  }
}

export const GameBoardActions = new GameBoardActionsBase()

export type GameBoardAction =
  | GameBoardActionsBase[keyof GameBoardActionsBase]
  | (() => {
      type: typeof T_SET_VIBRATION
      payload: number
    })
  | (() => {
      type: typeof T_SET_PACE
      payload: number
    })
