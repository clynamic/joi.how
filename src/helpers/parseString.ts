import { HypnoMode, PlayerGender, PlayerParts } from '../features/gameboard/types'
import { type ISettingsState } from '../features/settings/store'

export function formatMessage(msg: string, settings: ISettingsState): string {
  return msg
    .replace('$player', transform('player', settings))
    .replace('$Player', transform('Player', settings))
    .replace('$part', transform('part', settings))
    .replace('$Part', transform('Part', settings))
    .replace('$hands', transform('hands', settings))
    .replace('$HANDS', transform('HANDS', settings))
    .replace('$master', transform('master', settings))
    .replace('$Master', transform('Master', settings))
    .replace('$stroke', transform('stroke', settings))
}

function transform(token: string, settings: ISettingsState): string {
  switch (token) {
    case 'player':
      switch (settings.player.gender) {
        case PlayerGender.Female:
          return 'girl'
        case PlayerGender.Male:
          return 'boy'
        case PlayerGender.Neutral:
          return 'pup'
        default:
          return 'pup'
      }
    case 'master':
      switch (settings.hypno) {
        case HypnoMode.FemDomPet:
        case HypnoMode.Pet:
          return 'master'
        default:
          return ''
      }
    case 'HANDS':
      if (settings.hypno === HypnoMode.FemDomPet || settings.hypno === HypnoMode.Pet) {
        return 'PAWS'
      } else {
        return 'HANDS'
      }
    case 'hands':
      if (settings.hypno === HypnoMode.FemDomPet || settings.hypno === HypnoMode.Pet) {
        return 'paws'
      } else {
        return 'hands'
      }
    case 'part':
      switch (settings.player.parts) {
        case PlayerParts.Cock:
          return 'cock'
        case PlayerParts.Pussy:
          return 'pussy'
        case PlayerParts.Neuter:
          return 'mound'
        default:
          return 'crotch'
      }
    case 'Part':
      switch (settings.player.parts) {
        case PlayerParts.Cock:
          return 'Cock'
        case PlayerParts.Pussy:
          return 'Pussy'
        case PlayerParts.Neuter:
          return 'Mound'
        default:
          return token
      }
    case 'stroke':
      if (settings.player.parts === PlayerParts.Cock) {
        return 'stroke'
      } else {
        return 'paw'
      }
    default:
      return token
  }
}
