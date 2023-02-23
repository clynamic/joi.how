import { type AnyAction, type ThunkDispatch } from '@reduxjs/toolkit'
import { events } from '../features/gameboard'

import { HypnoMode, PlayerGender, PlayerParts } from '../features/gameboard/types'
import { SettingsActions } from '../features/settings/store'
import { type IState } from '../store'

export class SaveError extends Error {}
export class SavePornEncodingError extends SaveError {}
export class SaveVersionEncodingError extends SaveError {}

export function applyAllSettings(dispatch: ThunkDispatch<IState, unknown, AnyAction>, settings: Partial<IState['settings']>): void {
  if (settings.duration != null) dispatch(SettingsActions.SetDuration(settings.duration))
  if (settings.steepness != null) dispatch(SettingsActions.SetSteepness(settings.steepness))
  if (settings.eventList != null) dispatch(SettingsActions.SetEventList(settings.eventList))
  if (settings.hypnoMode != null) dispatch(SettingsActions.SetHypnoMode(settings.hypnoMode))
  if (settings.player?.gender != null) dispatch(SettingsActions.SetPlayerGender(settings.player.gender))
  if (settings.player?.parts != null) dispatch(SettingsActions.SetPlayerParts(settings.player.parts))
  if (settings.pace?.max != null) dispatch(SettingsActions.SetMaxPace(settings.pace.max))
  if (settings.pace?.min != null) dispatch(SettingsActions.SetMinPace(settings.pace.min))
  if (settings.credentials != null) dispatch(SettingsActions.SetCredentials(settings.credentials))
  if (settings.pornList != null) dispatch(SettingsActions.SetPornList(settings.pornList))
  if (settings.cum?.ejaculateLikelihood != null) dispatch(SettingsActions.SetEjaculateLikelihood(settings.cum.ejaculateLikelihood))
  if (settings.cum?.ruinLikelihood != null) dispatch(SettingsActions.SetRuinLikelihood(settings.cum.ruinLikelihood))
}

export function makeSave(settings: Partial<IState['settings']>, includeCredentials: boolean): string {
  const pace: IState['settings']['pace'] = settings.pace ?? { min: 0.75, max: 5 }
  const steepness: IState['settings']['steepness'] = settings.steepness ?? 0.05
  const duration: IState['settings']['duration'] = settings.duration ?? 6000
  const credentials: IState['settings']['credentials'] = settings.credentials ?? null
  const pornList: IState['settings']['pornList'] = settings.pornList ?? []
  const eventList: IState['settings']['eventList'] = settings.eventList ?? events.map((event) => event.id)
  const hypnoMode: IState['settings']['hypnoMode'] = settings.hypnoMode === undefined ? HypnoMode.JOI : settings.hypnoMode
  const playerMode: IState['settings']['player'] = settings.player ?? { gender: PlayerGender.Male, parts: PlayerParts.Cock }
  const cum: IState['settings']['cum'] = settings.cum === undefined ? { ejaculateLikelihood: 100, ruinLikelihood: 0 } : settings.cum
  const walltakerLink: IState['settings']['walltakerLink'] = settings.walltakerLink ?? null

  let output = 'JOI1'
  output += `:PN${pace.min}`
  output += `:PX${pace.max}`
  output += `:S${steepness * 100}`
  output += `:D${duration / 100}`
  if (includeCredentials && credentials != null) output += `:C${btoa(JSON.stringify(credentials))}`
  output += `:P${pornList.reduce((acc, porn) => `${acc}${acc != null ? ',' : ''}${encodePorn(porn)}`, '')}`
  output += `:E{${eventList.reduce((acc, eventId) => `${acc}${acc != null ? ',' : ''}${eventId}`, '')}}`
  output += `:H${hypnoMode}`
  output += `:PG${playerMode.gender}`
  output += `:PP${playerMode.parts}`
  output += `:CE${cum.ejaculateLikelihood}`
  output += `:CR${cum.ruinLikelihood}`
  if (walltakerLink != null) output += `:W${walltakerLink}`

  return btoa(output)
}

export function unpackSave(base64Save: string): IState['settings'] {
  const save = atob(base64Save)
  const settings: IState['settings'] = {
    dialogShown: false,
    pace: { min: 0.75, max: 5 },
    steepness: 0.05,
    duration: 6000,
    credentials: null,
    pornList: [],
    eventList: events.map((event) => event.id),
    hypnoMode: HypnoMode.JOI,
    player: { gender: PlayerGender.Male, parts: PlayerParts.Cock },
    cum: {
      ejaculateLikelihood: 100,
      ruinLikelihood: 0,
    },
    walltakerLink: null,
  }

  if (save.slice(0, 5) !== 'JOI1:') throw new SaveVersionEncodingError()

  const paceMinString = save.match(/:PN[\d.]+/g)
  if (paceMinString?.[0] != null) {
    settings.pace.min = parseFloat(paceMinString[0].replace(':PN', ''))
  }

  const paceMaxString = save.match(/:PX[\d.]+/g)
  if (paceMaxString?.[0] != null) {
    settings.pace.max = parseFloat(paceMaxString[0].replace(':PX', ''))
  }

  const steepnessString = save.match(/:S[\d.-]+/g)
  if (steepnessString?.[0] != null) {
    settings.steepness = parseFloat(steepnessString[0].replace(':S', '')) / 100
  }

  const durationString = save.match(/:D[\d.]+/g)
  if (durationString?.[0] != null) {
    settings.duration = parseFloat(durationString[0].replace(':D', '')) * 100
  }

  // Matches a base64 encoded string
  const credentials = save.match(/:C(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g)
  if (credentials?.[0] != null) {
    settings.credentials = JSON.parse(atob(credentials[0].replace(/^:C/, '')))
  }

  const pornListString = save.match(/:P[a-z0-9.|,@]+/g)
  if (pornListString?.[0] != null) {
    settings.pornList = pornListString[0].replace(/^:P/, '').split(',').map(decodePorn)
  }

  const eventListString = save.match(/:E\{[a-zA-Z,]*\}/g)
  if (eventListString?.[0] != null) {
    settings.eventList = eventListString[0].replace(/^:E\{/, '').replace(/}$/, '').split(',')
  }

  const hypnoModeString = save.match(/:H\d+/g)
  if (hypnoModeString?.[0] != null) {
    settings.hypnoMode = parseInt(hypnoModeString[0].replace(':H', ''), 10)
  }

  const playerGenderString = save.match(/:PM\d+/g)
  if (playerGenderString?.[0] != null) {
    settings.player.gender = parseInt(playerGenderString[0].replace(':PG', ''), 10)
  }

  const playerPartsString = save.match(/:PM\d+/g)
  if (playerPartsString?.[0] != null) {
    settings.player.parts = parseInt(playerPartsString[0].replace(':PP', ''), 10)
  }

  const ejaculateLikelihoodString = save.match(/:CE\d+/g)
  if (ejaculateLikelihoodString?.[0] != null) {
    settings.cum.ejaculateLikelihood = parseInt(ejaculateLikelihoodString[0].replace(':CE', ''), 10)
  }

  const ruinLikelihoodString = save.match(/:CR\d+/g)
  if (ruinLikelihoodString?.[0] != null) {
    settings.cum.ruinLikelihood = parseInt(ruinLikelihoodString[0].replace(':CR', ''), 10)
  }

  const walltakerLinkString = save.match(/:W\d+/g)
  if (walltakerLinkString?.[0] != null) {
    settings.walltakerLink = parseInt(walltakerLinkString[0].replace(':W', ''), 10)
  }

  return settings
}

const PORN_HEX_CHUNK_SIZE = 11

function encodePorn(porn: string): string {
  const result = porn.match(/\/[a-f0-9]+\/[a-f0-9]+\/[a-f0-9]+\..+$/)
  if (result?.[0] != null) {
    const encoded = result[0].replace(/\//g, '')
    const hexPortions = encoded.match(new RegExp(`[a-f0-9]{${PORN_HEX_CHUNK_SIZE}}`, 'g'))
    if (encoded != null && hexPortions != null) {
      return (
        hexPortions
          .reduce((output, hexPortion) => {
            return output.replace(
              hexPortion,
              parseInt('1' + hexPortion, 16)
                .toString(36)
                .toUpperCase() + '|',
            )
          }, encoded)
          .replace(/\|\./, '.')
          .toLowerCase() + `@${porn.includes('/sample/') ? 'l' : 'h'}`
      )
    }
  }
  throw new SavePornEncodingError()
}

function decodePorn(encoded: string): string {
  const encodedPortions = encoded.match(/[a-z0-9]+/g)
  if (encodedPortions != null) {
    const hex = encodedPortions
      .slice(0, -1)
      .reduce((output, encodedPortion) => {
        if (parseInt(encodedPortion, 36).toString(16).length === PORN_HEX_CHUNK_SIZE + 1) {
          return output.replace(encodedPortion, parseInt(encodedPortion, 36).toString(16).toUpperCase().slice(1))
        } else return output
      }, encoded)
      .replace(/\|/g, '')
      .toLowerCase()

    return `https://static1.e621.net/data/${hex.slice(-2) === '@l' ? 'sample/' : '/'}${hex.slice(0, 2)}/${hex.slice(2, 4)}/${hex.slice(
      4,
      -2,
    )}`
  }
  throw new SavePornEncodingError()
}
