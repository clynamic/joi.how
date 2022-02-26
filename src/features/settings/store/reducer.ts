import {
  SettingsAction,
  T_SET_MIN_PACE,
  T_SET_MAX_PACE,
  T_OPEN_DIALOG,
  T_CLOSE_DIALOG,
  T_SET_PORN_LIST,
  T_SET_DURATION,
  T_SET_EVENT_LIST,
  T_SET_HYPNO_MODE,
  T_SET_STEEPNESS,
  T_SET_EJACULATE_LIKELIHOOD,
  T_SET_RUIN_LIKELIHOOD, T_SET_WALLTAKER_LINK,
} from './actions'
import { PornList, EventToken, HypnoMode } from '../../gameboard/types'
import { events } from '../../gameboard/events/index'

export interface ISettingsState {
  dialogShown: boolean
  pace: {
    min: number
    max: number
  }
  steepness: number
  duration: number
  pornList: PornList
  eventList: EventToken['id'][]
  hypnoMode: HypnoMode
  cum: {
    ejaculateLikelihood: number
    ruinLikelihood: number
  },
  walltakerLink: number | null
}

export const SettingsDefaultState: ISettingsState = {
  dialogShown: false,
  pace: {
    min: 0.75,
    max: 5,
  },
  steepness: 0.05,
  duration: 6000,
  pornList: [],
  eventList: events.map(event => event.id),
  hypnoMode: HypnoMode.JOI,
  cum: {
    ejaculateLikelihood: 100,
    ruinLikelihood: 0,
  },
  walltakerLink: null
}

export function SettingsReducer(state: ISettingsState = SettingsDefaultState, action: ReturnType<SettingsAction>): ISettingsState {
  switch (action.type) {
    case T_OPEN_DIALOG:
      return {
        ...state,
        dialogShown: true,
      }
    case T_CLOSE_DIALOG:
      return {
        ...state,
        dialogShown: false,
      }
    case T_SET_MIN_PACE:
      return {
        ...state,
        pace: {
          ...state.pace,
          min: action.payload,
        },
      }
    case T_SET_MAX_PACE:
      return {
        ...state,
        pace: {
          ...state.pace,
          max: action.payload,
        },
      }
    case T_SET_STEEPNESS:
      return {
        ...state,
        steepness: action.payload,
      }
    case T_SET_DURATION:
      return {
        ...state,
        duration: action.payload,
      }
    case T_SET_PORN_LIST:
      return {
        ...state,
        pornList: action.payload,
      }
    case T_SET_EVENT_LIST:
      return {
        ...state,
        eventList: action.payload,
      }
    case T_SET_HYPNO_MODE:
      return {
        ...state,
        hypnoMode: action.payload,
      }
    case T_SET_EJACULATE_LIKELIHOOD:
      return {
        ...state,
        cum: {
          ...state.cum,
          ejaculateLikelihood: action.payload,
        },
      }
    case T_SET_RUIN_LIKELIHOOD:
      return {
        ...state,
        cum: {
          ...state.cum,
          ruinLikelihood: action.payload,
        },
      }
    case T_SET_WALLTAKER_LINK:
      return {
        ...state,
        walltakerLink: action.payload,
      }
    default:
      return state
  }
}
