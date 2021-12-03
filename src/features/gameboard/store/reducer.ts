import {
  GameBoardAction,
  T_SET_PACE,
  T_SHOW_MESSAGE,
  T_PULSE,
  T_SET_GRIP,
  T_PAUSE_EVENTS,
  T_RESUME_EVENTS,
  T_INC_INTENSITY,
  T_DEC_INTENSITY,
  T_CUM,
  T_PAUSE_GAME,
  T_RESUME_GAME,
} from './actions'
import { EStroke, EGrip } from '../types'
import { Message, applyMessage } from '../MessageArea/MessageTypes'
import { round } from '../../../helpers/round'
import { T_SET_VIBRATION } from './actions'

export interface IGameBoardState {
  pace: number
  grip: EGrip
  intensity: number
  messages: Message[]
  stroke: EStroke
  eventsPaused: boolean
  gamePaused: boolean
  cumming: boolean
  vibration: number
}

export const GameBoardDefaultState: IGameBoardState = {
  pace: 1,
  grip: EGrip.right,
  intensity: 0,
  messages: [],
  stroke: EStroke.down,
  eventsPaused: false,
  gamePaused: false,
  cumming: false,
  vibration: 0,
}

export function GameBoardReducer(state: IGameBoardState = GameBoardDefaultState, action: ReturnType<GameBoardAction>): IGameBoardState {
  if (typeof action !== 'object') return state
  switch (action.type) {
    case T_SET_PACE:
      return {
        ...state,
        pace: round(action.payload),
      }
    case T_SET_GRIP:
      return {
        ...state,
        grip: action.payload,
      }
    case T_SHOW_MESSAGE:
      return {
        ...state,
        messages: applyMessage(state.messages, action.payload),
      }
    case T_PULSE:
      return {
        ...state,
        stroke: state.stroke === EStroke.down ? EStroke.up : EStroke.down,
      }
    case T_PAUSE_EVENTS:
      return {
        ...state,
        eventsPaused: true,
      }
    case T_RESUME_EVENTS:
      return {
        ...state,
        eventsPaused: false,
      }
    case T_PAUSE_GAME:
      return {
        ...state,
        gamePaused: true,
      }
    case T_RESUME_GAME:
      return {
        ...state,
        gamePaused: false,
      }
    case T_INC_INTENSITY:
      return {
        ...state,
        intensity: Math.min(state.intensity + action.payload, 100),
      }
    case T_DEC_INTENSITY:
      return {
        ...state,
        intensity: Math.max(state.intensity - action.payload, 0),
      }
    case T_CUM:
      return {
        ...state,
        cumming: true,
      }
    case T_SET_VIBRATION:
      return {
        ...state,
        vibration: action.payload,
      }
    default:
      return state
  }
}
