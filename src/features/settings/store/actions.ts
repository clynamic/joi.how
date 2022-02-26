import { PornList, EventToken, HypnoMode } from '../../gameboard/types'

export const T_OPEN_DIALOG = 'OPEN_DIALOG'
export const T_CLOSE_DIALOG = 'CLOSE_DIALOG'
export const T_SET_MIN_PACE = 'SET_MIN_PACE'
export const T_SET_MAX_PACE = 'SET_MAX_PACE'
export const T_SET_STEEPNESS = 'SET_STEEPNESS'
export const T_SET_DURATION = 'SET_DURATION'
export const T_SET_PORN_LIST = 'SET_PORN_LIST'
export const T_SET_EVENT_LIST = 'SET_EVENT_LIST'
export const T_SET_HYPNO_MODE = 'SET_HYPNO_MODE'
export const T_SET_EJACULATE_LIKELIHOOD = 'SET_EJACULATE_LIKELIHOOD'
export const T_SET_RUIN_LIKELIHOOD = 'SET_RUIN_LIKELIHOOD'
export const T_SET_WALLTAKER_LINK = 'SET_WALLTAKER_LINK'

class SettingsActionsBase {
  OpenDialog = () => ({
    type: T_OPEN_DIALOG as typeof T_OPEN_DIALOG,
  })

  CloseDialog = () => ({
    type: T_CLOSE_DIALOG as typeof T_CLOSE_DIALOG,
  })

  SetMinPace = (newPace: number) => ({
    type: T_SET_MIN_PACE as typeof T_SET_MIN_PACE,
    payload: newPace,
  })

  SetMaxPace = (newPace: number) => ({
    type: T_SET_MAX_PACE as typeof T_SET_MAX_PACE,
    payload: newPace,
  })

  SetSteepness = (newSteepness: number) => ({
    type: T_SET_STEEPNESS as typeof T_SET_STEEPNESS,
    payload: newSteepness,
  })

  SetGameDuration = (duration: number) => ({
    type: T_SET_DURATION as typeof T_SET_DURATION,
    payload: duration,
  })

  SetPornList = (pornList: PornList) => ({
    type: T_SET_PORN_LIST as typeof T_SET_PORN_LIST,
    payload: pornList,
  })

  SetEventList = (eventList: EventToken['id'][]) => ({
    type: T_SET_EVENT_LIST as typeof T_SET_EVENT_LIST,
    payload: eventList,
  })

  SetHypnoMode = (newMode: HypnoMode) => ({
    type: T_SET_HYPNO_MODE as typeof T_SET_HYPNO_MODE,
    payload: newMode,
  })

  SetEjaculateLikelihood = (newLikelihood: number) => ({
    type: T_SET_EJACULATE_LIKELIHOOD as typeof T_SET_EJACULATE_LIKELIHOOD,
    payload: newLikelihood,
  })

  SetRuinLikelihood = (newLikelihood: number) => ({
    type: T_SET_RUIN_LIKELIHOOD as typeof T_SET_RUIN_LIKELIHOOD,
    payload: newLikelihood,
  })

  SetWalltakerLink = (newWalltakerLink: number | null) => ({
    type: T_SET_WALLTAKER_LINK as typeof T_SET_WALLTAKER_LINK,
    payload: newWalltakerLink,
  })
}

export const SettingsActions = new SettingsActionsBase()

export type SettingsAction = SettingsActionsBase[keyof SettingsActionsBase]
