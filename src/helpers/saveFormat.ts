import { PornService, type Credentials } from '../features/gameboard/types'
import { type Action, type ThunkDispatch } from '@reduxjs/toolkit'
import { SettingsActions } from '../features/settings/store'
import { type IState } from '../store'
import { debounce } from 'lodash'

interface EncodedSettings {
  paceMin: IState['settings']['pace']['min']
  paceMax: IState['settings']['pace']['max']
  steepness: IState['settings']['steepness']
  warmpupDuration: IState['settings']['warmupDuration']
  duration: IState['settings']['duration']
  credentials?: string
  porn: IState['settings']['porn']
  pornQuality: IState['settings']['pornQuality']
  startVideosAtRandomTime: IState['settings']['startVideosAtRandomTime']
  events: IState['settings']['events']
  hypno: IState['settings']['hypno']
  gender: IState['settings']['player']['gender']
  parts: IState['settings']['player']['parts']
  ejac: IState['settings']['cum']['ejaculateLikelihood']
  ruin: IState['settings']['cum']['ruinLikelihood']
  walltaker?: IState['settings']['walltaker']
}

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P]
}

export type DecodedSettings = Partial<
  Pick<
    IState['settings'],
    | 'warmupDuration'
    | 'duration'
    | 'steepness'
    | 'events'
    | 'hypno'
    | 'credentials'
    | 'porn'
    | 'pornQuality'
    | 'startVideosAtRandomTime'
    | 'walltaker'
  >
> &
  RecursivePartial<Pick<IState['settings'], 'player' | 'pace' | 'cum'>>

export class SaveError extends Error {}
export class SavePornEncodingError extends SaveError {}
export class SaveVersionEncodingError extends SaveError {}

export function encodeSettings(settings: IState['settings'], options?: { includeCredentials?: boolean }): string {
  const pace: IState['settings']['pace'] = settings.pace
  const steepness: IState['settings']['steepness'] = settings.steepness
  const warmpupDuration: IState['settings']['warmupDuration'] = settings.warmupDuration
  const duration: IState['settings']['duration'] = settings.duration
  const credentials: IState['settings']['credentials'] = settings.credentials
  const porn: IState['settings']['porn'] = settings.porn.filter(({ service }) => service !== PornService.LOCAL)
  const pornQuality: IState['settings']['pornQuality'] = settings.pornQuality
  const startVideosAtRandomTime: IState['settings']['startVideosAtRandomTime'] = settings.startVideosAtRandomTime
  const events: IState['settings']['events'] = settings.events
  const hypno: IState['settings']['hypno'] = settings.hypno
  const player: IState['settings']['player'] = settings.player
  const cum: IState['settings']['cum'] = settings.cum
  const walltaker: IState['settings']['walltaker'] = settings.walltaker

  const output: EncodedSettings = {
    paceMin: pace.min,
    paceMax: pace.max,
    steepness,
    warmpupDuration,
    duration,
    credentials: options?.includeCredentials ? encodeCredentials(credentials) : undefined,
    porn,
    pornQuality,
    startVideosAtRandomTime,
    events,
    hypno,
    gender: player.gender,
    parts: player.parts,
    ejac: cum.ejaculateLikelihood,
    ruin: cum.ruinLikelihood,
    walltaker,
  }

  return objectToURLParams(output)
}

export function decodeSettings(url: string): DecodedSettings {
  const {
    paceMin,
    paceMax,
    steepness,
    warmpupDuration,
    duration,
    credentials,
    porn,
    pornQuality,
    startVideosAtRandomTime,
    events,
    hypno,
    gender,
    parts,
    ejac,
    ruin,
    walltaker,
  }: Partial<EncodedSettings> = urlParamsToObject(url)

  return {
    pace: {
      min: paceMin,
      max: paceMax,
    },
    steepness,
    warmupDuration: warmpupDuration,
    duration,
    credentials: decodeCredentials(credentials),
    porn,
    pornQuality,
    startVideosAtRandomTime,
    events,
    hypno: hypno,
    player: {
      gender,
      parts,
    },
    cum: {
      ejaculateLikelihood: ejac,
      ruinLikelihood: ruin,
    },
    walltaker,
  }
}

export const saveSettings = debounce((settings: IState['settings']) => {
  localStorage.setItem('lastSession', window.btoa(encodeSettings(settings, { includeCredentials: true })))
}, 1000)

export const loadSettings = (dispatch: ThunkDispatch<IState, unknown, Action>): void => {
  const encodedSettings = localStorage.getItem('lastSession')
  if (encodedSettings) {
    const decodedSettings = window.atob(encodedSettings)
    applyAllSettings(decodeSettings(decodedSettings), dispatch)
  }
}

export function applyAllSettings(settings: DecodedSettings, dispatch: ThunkDispatch<IState, unknown, Action>): void {
  if (settings.warmupDuration != null) dispatch(SettingsActions.SetWarmupDuration(settings.warmupDuration))
  if (settings.duration != null) dispatch(SettingsActions.SetDuration(settings.duration))
  if (settings.steepness != null) dispatch(SettingsActions.SetSteepness(settings.steepness))
  if (settings.events != null) dispatch(SettingsActions.SetEventList(settings.events))
  if (settings.hypno != null) dispatch(SettingsActions.SetHypnoMode(settings.hypno))
  if (settings.player?.gender != null) dispatch(SettingsActions.SetPlayerGender(settings.player.gender))
  if (settings.player?.parts != null) dispatch(SettingsActions.SetPlayerParts(settings.player.parts))
  if (settings.pace?.max != null) dispatch(SettingsActions.SetMaxPace(settings.pace.max))
  if (settings.pace?.min != null) dispatch(SettingsActions.SetMinPace(settings.pace.min))
  if (settings.credentials != null) dispatch(SettingsActions.SetAllCredentials(settings.credentials))
  if (settings.porn != null) dispatch(SettingsActions.SetPornList(settings.porn))
  if (settings.pornQuality != null) dispatch(SettingsActions.SetPornQuality(settings.pornQuality))
  if (settings.startVideosAtRandomTime != null) dispatch(SettingsActions.SetStartVideosAtRandomTime(settings.startVideosAtRandomTime))
  if (settings.cum?.ejaculateLikelihood != null) dispatch(SettingsActions.SetEjaculateLikelihood(settings.cum.ejaculateLikelihood))
  if (settings.cum?.ruinLikelihood != null) dispatch(SettingsActions.SetRuinLikelihood(settings.cum.ruinLikelihood))
}

function encodeCredentials(credentials?: Credentials): string | undefined {
  if (credentials == null) return undefined
  return window.btoa(JSON.stringify(credentials))
}

function decodeCredentials(credentials?: string): Credentials | undefined {
  if (credentials == null) return undefined
  const decoded = window.atob(credentials)
  return JSON.parse(decoded)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function objectToURLParams(obj: Record<string, any>): string {
  const params = new URLSearchParams()

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      let value = obj[key]
      if (value !== undefined) {
        if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
          value = JSON.stringify(value)
        }
        params.append(key, value)
      }
    }
  }

  return params.toString()
}

function urlParamsToObject(urlParams: string): Record<string, unknown> {
  const obj: Record<string, unknown> = {}

  const params = new URLSearchParams(urlParams)
  const iterator = params.entries()

  let current = iterator.next()
  while (!current.done) {
    const [key, value] = current.value
    try {
      obj[key] = JSON.parse(value)
    } catch (error) {
      obj[key] = value
    }
    current = iterator.next()
  }

  return obj
}
