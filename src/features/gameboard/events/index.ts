import { IState } from '../../../store'
import { GameEvent, EventToken } from '../types'
import { randomGrip } from './event-definitions/tasks/randomGrip'
import { randomPace } from './event-definitions/pace/randomPace'
import { risingPace } from './event-definitions/pace/risingPace'
import { doublePace } from './event-definitions/pace/doublePace'
import { halfPace } from './event-definitions/pace/halfPace'
import { cum } from './event-definitions/edging/cum'
import { edge } from './event-definitions/edging/edge'
import { tease } from './event-definitions/edging/tease'
import { cleanMess } from './event-definitions/tasks/cleanMess'
import { pause } from './event-definitions/pace/pause'

export const events = [
  { id: 'cum', name: 'Cum', description: 'Creates an end point to the game. Enable this to adjust ruin/cum/denial options.' },
  { id: 'edge', name: 'Edge Safety Net', description: "Slows down when intensity is almost at it's highest." },
  { id: 'tease', name: 'Teas Me', description: 'TODO' },
  { id: 'doublePace', name: 'Double Pace', description: 'Paw at twice the current pace for a few seconds.' },
  { id: 'halfPace', name: 'Half Pace', description: 'Paw at half the current pace for a few seconds.' },
  { id: 'pause', name: 'Pause', description: 'Stop stroking for a little bit.' },
  { id: 'risingPace', name: 'Rising Pace', description: 'Start from your lowest and slowly pick up speed.' },
  { id: 'randomPace', name: 'Random Pace', description: 'Randomly select a new pace to jack off at.' },
  { id: 'randomGrip', name: 'Random Grip', description: 'Randomly select a new way for you to grip your cock.' },
  { id: 'cleanMess', name: 'Clean Up Mess', description: "Clean up any mess you've made along the way." },
] as EventToken[]

const flags = {
  hasEdged: false,
}

export function getNextEvent(state: IState): ReturnType<GameEvent> | null {
  if (!state.game.eventsPaused && !state.game.gamePaused) {
    if (state.game.intensity >= 100 && isEnabled('cum', state)) {
      return cum()
    }

    if (state.game.intensity >= 90 && !flags.hasEdged && isEnabled('edge', state)) {
      flags.hasEdged = true
      return edge()
    }

    if (state.game.intensity >= 50 && isEnabled('tease', state)) {
      return tease()
    }

    if (chance(1, 10) && isEnabled('randomPace', state)) {
      return randomPace(undefined)
    }

    if (chance(1, 25) && state.game.intensity >= 75 && isEnabled('cleanMess', state)) {
      return cleanMess()
    }

    if (chance(1, 55) && isEnabled('randomGrip', state)) {
      return randomGrip()
    }

    if (chance(1, moreLikelyAs(55, state.game.intensity - 20, 0.25)) && state.game.intensity > 20 && isEnabled('doublePace', state)) {
      return doublePace()
    }

    if (chance(1, 55) && state.game.intensity < 50 && isEnabled('halfPace', state)) {
      return halfPace()
    }

    if (chance(1, 55) && state.game.intensity > 15 && isEnabled('pause', state)) {
      return pause()
    }

    if (chance(1, 30) && state.game.intensity > 30 && isEnabled('risingPace', state)) {
      return risingPace(Math.round(100 / Math.min(state.game.intensity, 35)))
    }
  }
  return null
}

function isEnabled(eventKey: EventToken['id'], state: IState) {
  return state.settings.eventList.indexOf(eventKey) > -1
}

function chance(numerator: number, denominator: number): boolean {
  return Math.floor(Math.random() * denominator) < numerator
}

function moreLikelyAs(initialValue: number, factor: number, stepPerFactor: number) {
  return initialValue - factor * stepPerFactor
}
