import { IState } from '../store'
import { events } from '../features/gameboard/events/index'
import { HypnoMode, PlayerGender, PlayerParts } from '../features/gameboard/types'
import { SettingsActions } from '../features/settings/store'
import { PropsForConnectedComponent } from '../store.types'

export class SaveError extends Error {}
export class SavePornEncodingError extends SaveError {}
export class SaveVersionEncodingError extends SaveError {}

export function applyAllSettings(dispatch: PropsForConnectedComponent['dispatch'], settings: Partial<IState['settings']>): void {
  if (settings.duration) dispatch(SettingsActions.SetDuration(settings.duration))
  if (settings.steepness) dispatch(SettingsActions.SetSteepness(settings.steepness))
  if (settings.eventList) dispatch(SettingsActions.SetEventList(settings.eventList))
  if (settings.hypnoMode) dispatch(SettingsActions.SetHypnoMode(settings.hypnoMode))
  if (settings.player && settings.player.gender) dispatch(SettingsActions.SetPlayerGender(settings.player.gender))
  if (settings.player && settings.player.parts) dispatch(SettingsActions.SetPlayerParts(settings.player.parts))
  if (settings.pace && settings.pace.max) dispatch(SettingsActions.SetMaxPace(settings.pace.max))
  if (settings.pace && settings.pace.min) dispatch(SettingsActions.SetMinPace(settings.pace.min))
  if (settings.credentials) dispatch(SettingsActions.SetCredentials(settings.credentials))
  if (settings.pornList) dispatch(SettingsActions.SetPornList(settings.pornList))
  if (settings.cum && settings.cum.ejaculateLikelihood) dispatch(SettingsActions.SetEjaculateLikelihood(settings.cum.ejaculateLikelihood))
  if (settings.cum && settings.cum.ruinLikelihood) dispatch(SettingsActions.SetRuinLikelihood(settings.cum.ruinLikelihood))
}

export function makeSave(settings: Partial<IState['settings']>, includeCredentials: boolean) {
  const pace: IState['settings']['pace'] = settings.pace || { min: 0.75, max: 5 }
  const steepness: IState['settings']['steepness'] = settings.steepness || 0.05
  const duration: IState['settings']['duration'] = settings.duration || 6000
  const credentials: IState['settings']['credentials'] = settings.credentials ?? null
  const pornList: IState['settings']['pornList'] = settings.pornList || []
  const eventList: IState['settings']['eventList'] = settings.eventList || events.map((event) => event.id)
  const hypnoMode: IState['settings']['hypnoMode'] = settings.hypnoMode === undefined ? HypnoMode.JOI : settings.hypnoMode
  const playerMode: IState['settings']['player'] = settings.player || { gender: PlayerGender.Male, parts: PlayerParts.Cock }
  const cum: IState['settings']['cum'] = settings.cum === undefined ? { ejaculateLikelihood: 100, ruinLikelihood: 0 } : settings.cum
  const walltakerLink: IState['settings']['walltakerLink'] = settings.walltakerLink ?? null

  let output = 'JOI1'
  output += `:PN${pace.min}`
  output += `:PX${pace.max}`
  output += `:S${steepness * 100}`
  output += `:D${duration / 100}`
  if (includeCredentials && credentials != null) output += `:C${btoa(JSON.stringify(credentials))}`
  output += `:P${pornList.reduce((acc, porn) => `${acc}${acc ? ',' : ''}${encodePorn(porn)}`, '')}`
  output += `:E{${eventList.reduce((acc, eventId) => `${acc}${acc ? ',' : ''}${eventId}`, '')}}`
  output += `:H${hypnoMode}`
  output += `:PG${playerMode.gender}`
  output += `:PP${playerMode.parts}`
  output += `:CE${cum.ejaculateLikelihood}`
  output += `:CR${cum.ruinLikelihood}`
  if (walltakerLink) output += `:W${walltakerLink}`
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
  if (paceMinString && paceMinString[0]) {
    settings.pace.min = parseFloat(paceMinString[0].replace(':PN', ''))
  }

  const paceMaxString = save.match(/:PX[\d.]+/g)
  if (paceMaxString && paceMaxString[0]) {
    settings.pace.max = parseFloat(paceMaxString[0].replace(':PX', ''))
  }

  const steepnessString = save.match(/:S[\d.-]+/g)
  if (steepnessString && steepnessString[0]) {
    settings.steepness = parseFloat(steepnessString[0].replace(':S', '')) / 100
  }

  const durationString = save.match(/:D[\d.]+/g)
  if (durationString && durationString[0]) {
    settings.duration = parseFloat(durationString[0].replace(':D', '')) * 100
  }

  // Matches a base64 encoded string
  const credentials = save.match(/:C(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?/g)
  if (credentials && credentials[0]) {
    settings.credentials = JSON.parse(atob(credentials[0].replace(/^:C/, '')))
  }

  const pornListString = save.match(/:P[a-z0-9.|,@]+/g)
  if (pornListString && pornListString[0]) {
    settings.pornList = pornListString[0].replace(/^:P/, '').split(',').map(decodePorn)
  }

  const eventListString = save.match(/:E\{[a-zA-Z,]*\}/g)
  if (eventListString && eventListString[0]) {
    settings.eventList = eventListString[0].replace(/^:E\{/, '').replace(/}$/, '').split(',')
  }

  const hypnoModeString = save.match(/:H\d+/g)
  if (hypnoModeString && hypnoModeString[0]) {
    settings.hypnoMode = parseInt(hypnoModeString[0].replace(':H', ''), 10)
  }

  const playerGenderString = save.match(/:PM\d+/g)
  if (playerGenderString && playerGenderString[0]) {
    settings.player.gender = parseInt(playerGenderString[0].replace(':PG', ''), 10)
  }

  const playerPartsString = save.match(/:PM\d+/g)
  if (playerPartsString && playerPartsString[0]) {
    settings.player.parts = parseInt(playerPartsString[0].replace(':PP', ''), 10)
  }

  const ejaculateLikelihoodString = save.match(/:CE\d+/g)
  if (ejaculateLikelihoodString && ejaculateLikelihoodString[0]) {
    settings.cum.ejaculateLikelihood = parseInt(ejaculateLikelihoodString[0].replace(':CE', ''), 10)
  }

  const ruinLikelihoodString = save.match(/:CR\d+/g)
  if (ruinLikelihoodString && ruinLikelihoodString[0]) {
    settings.cum.ruinLikelihood = parseInt(ruinLikelihoodString[0].replace(':CR', ''), 10)
  }

  const walltakerLinkString = save.match(/:W\d+/g)
  if (walltakerLinkString && walltakerLinkString[0]) {
    settings.walltakerLink = parseInt(walltakerLinkString[0].replace(':W', ''), 10)
  }

  return settings
}

const PORN_HEX_CHUNK_SIZE = 11

function encodePorn(porn: string) {
  const result = porn.match(/\/[a-f0-9]+\/[a-f0-9]+\/[a-f0-9]+\..+$/)
  if (result && result[0]) {
    let encoded = result[0].replace(/\//g, '')
    let hexPortions = encoded.match(new RegExp(`[a-f0-9]{${PORN_HEX_CHUNK_SIZE}}`, 'g'))
    if (encoded && hexPortions) {
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

function decodePorn(encoded: string) {
  let encodedPortions = encoded.match(/[a-z0-9]+/g)
  if (encodedPortions) {
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
