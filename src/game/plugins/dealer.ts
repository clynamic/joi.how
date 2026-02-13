import type { Plugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { Events, getEventKey } from '../../engine/pipes/Events';
import { Scheduler } from '../../engine/pipes/Scheduler';
import { GamePhase } from './phase';
import Pause from './pause';
import { GameEvent as GameEventType } from '../../types';
import {
  PLUGIN_ID,
  dice,
  phaseState,
  intensityState,
  settings,
  gameContext,
  Paws,
  DiceOutcome,
} from './dice/types';
import { edgeOutcome } from './dice/edge';
import { pauseOutcome } from './dice/pause';
import { randomPaceOutcome } from './dice/randomPace';
import { doublePaceOutcome } from './dice/doublePace';
import { halfPaceOutcome } from './dice/halfPace';
import { risingPaceOutcome } from './dice/risingPace';
import { randomGripOutcome } from './dice/randomGrip';
import { cleanUpOutcome } from './dice/cleanUp';
import { climaxOutcome } from './dice/climax';
import {
  emergencyStopPipes,
  emergencyStopScheduleKeys,
} from './dice/emergencyStop';

declare module '../../engine/sdk' {
  interface PluginSDK {
    Dealer: typeof Dealer;
  }
}

const outcomes: DiceOutcome[] = [
  climaxOutcome,
  edgeOutcome,
  randomPaceOutcome,
  cleanUpOutcome,
  randomGripOutcome,
  doublePaceOutcome,
  halfPaceOutcome,
  pauseOutcome,
  risingPaceOutcome,
];

const rollChances: Record<string, number> = {
  [GameEventType.randomPace]: 10,
  [GameEventType.cleanUp]: 25,
  [GameEventType.randomGrip]: 50,
  [GameEventType.doublePace]: 50,
  [GameEventType.halfPace]: 50,
  [GameEventType.pause]: 50,
  [GameEventType.risingPace]: 30,
};

const eventKeyForOutcome = (id: GameEventType): string =>
  getEventKey(PLUGIN_ID, id);

const allScheduleKeys = [
  ...outcomes.flatMap(o => o.scheduleKeys),
  ...emergencyStopScheduleKeys,
];

export default class Dealer {
  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Dealer',
    },

    activate: Composer.do(({ get, set }) => {
      set(dice.state, {
        edged: false,
        paws: Paws.both,
        busy: false,
        rollTimer: 0,
      });

      const s = get(settings);
      if (s?.events?.includes(GameEventType.randomGrip)) {
        const seed = Math.random();
        let paws = Paws.both;
        if (seed < 0.33) paws = Paws.left;
        else if (seed < 0.66) paws = Paws.right;
        set(dice.state.paws, paws);
      }
    }),

    update: Composer.pipe(
      Pause.whenPlaying(
        Composer.do(({ get, set, pipe }) => {
          const phase = get(phaseState)?.current;
          if (phase !== GamePhase.active) return;

          const state = get(dice.state);
          if (!state || state.busy) return;

          const delta = get(gameContext.deltaTime);
          const elapsed = state.rollTimer + delta;

          if (elapsed < 1000) {
            set(dice.state.rollTimer, elapsed);
            return;
          }

          set(dice.state.rollTimer, 0);

          const i = (get(intensityState)?.intensity ?? 0) * 100;
          const s = get(settings);
          if (!s) return;

          for (const outcome of outcomes) {
            if (!s.events.includes(outcome.id)) continue;
            if (!outcome.check(i, state.edged, s.events)) continue;

            const chance = rollChances[outcome.id];
            if (chance && Math.floor(Math.random() * chance) !== 0) continue;

            set(dice.state.busy, true);
            pipe(Events.dispatch({ type: eventKeyForOutcome(outcome.id) }));
            return;
          }
        })
      ),

      ...outcomes.map(o => o.pipes),

      emergencyStopPipes,

      Pause.onPause(() =>
        Composer.pipe(...allScheduleKeys.map(id => Scheduler.hold(id)))
      ),
      Pause.onResume(() =>
        Composer.pipe(...allScheduleKeys.map(id => Scheduler.release(id)))
      )
    ),

    deactivate: Composer.set(dice.state, undefined),
  };

  static get paths() {
    return dice;
  }
}

export { Paws, PawLabels, type DiceState } from './dice/types';
