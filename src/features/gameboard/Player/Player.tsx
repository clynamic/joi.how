import React from 'react'
import { ISettingsState } from '../../settings/store'
import { PlayerGender, PlayerParts, HypnoMode } from '../types'

export function formatMessage(msg: string, settings: ISettingsState) {
  return msg
    .replace('$player', transform('$player', settings))
    .replace('$Player', transform('$Player', settings))
    .replace('$part', transform('$part', settings))
    .replace('$Part', transform('$Part', settings))
    .replace('$hands', transform('$hands', settings))
    .replace('$HANDS', transform('$HANDS', settings))
    .replace('$master', transform('$master', settings))
    .replace('$Master', transform('$Master', settings))
}

function transform(token: string, settings: ISettingsState) {
  switch (token) {
    case '$player':
      switch (settings.player.gender) {
        case PlayerGender.Female:
          return 'girl'
        case PlayerGender.Male:
          return 'boy'
        case PlayerGender.Neutral:
          return 'pup'
      }
    case '$master':
      switch (settings.hypnoMode) {
        case HypnoMode.FemDomPet:
        case HypnoMode.Pet:
          return 'master'
        default:
          return ''
      }
    case '$HANDS':
      if (settings.hypnoMode == (HypnoMode.FemDomPet || HypnoMode.Pet)) {
        return 'PAWS'
      } else {
        return 'HANDS'
      }
    case '$hands':
      if (settings.hypnoMode == (HypnoMode.FemDomPet || HypnoMode.Pet)) {
        return 'paws'
      } else {
        return 'hands'
      }
    default:
      return token
  }
}
