import type { AsyncThunkAction } from '@reduxjs/toolkit'
import { chance, moreLikelyAs } from '../../../helpers/helpers'
import type { IState } from '../../../store'
import type { EventToken } from '../types'
import { CleanMess, Cum, DoublePace, Edge, HalfPace, Pause, RandomGrip, RandomPace, RisingPace } from './events'

function isEnabled(eventKey: EventToken['id'], state: IState): boolean {
  return state.settings.events.includes(eventKey)
}

export function getNextEvent(state: IState): AsyncThunkAction<unknown, unknown, Record<string, never>> | null {
  if (!state.game.eventsPaused && !state.game.gamePaused) {
    if (state.game.intensity >= 100 && isEnabled('cum', state)) {
      return Cum()
    }

    if (state.game.intensity >= 90 && !state.game.hasEdged && isEnabled('edge', state)) {
      return Edge()
    }

    if (chance(1, 10) && isEnabled('randomPace', state)) {
      return RandomPace(undefined)
    }

    if (chance(1, 25) && state.game.intensity >= 75 && isEnabled('cleanMess', state)) {
      return CleanMess()
    }

    if (chance(1, 55) && isEnabled('randomGrip', state)) {
      return RandomGrip()
    }

    if (chance(1, moreLikelyAs(55, state.game.intensity - 20, 0.25)) && state.game.intensity > 20 && isEnabled('doublePace', state)) {
      return DoublePace()
    }

    if (chance(1, 55) && state.game.intensity < 50 && isEnabled('halfPace', state)) {
      return HalfPace()
    }

    if (chance(1, 55) && state.game.intensity > 15 && isEnabled('pause', state)) {
      return Pause()
    }

    if (chance(1, 30) && state.game.intensity > 30 && isEnabled('risingPace', state)) {
      return RisingPace(Math.round(100 / Math.min(state.game.intensity, 35)))
    }
  }
  return null
}

export const GameEventActions = {
  Cum,
  Edge,
  DoublePace,
  HalfPace,
  Pause,
  RandomPace,
  RisingPace,
  CleanMess,
  RandomGrip,
}

export type GameEventAction = (typeof GameEventActions)[keyof typeof GameEventActions]
