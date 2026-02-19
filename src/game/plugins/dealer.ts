import type { Plugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { Pipe } from '../../engine/State';
import { Events } from '../../engine/pipes/Events';
import { Scheduler } from '../../engine/pipes/Scheduler';
import { Sequence } from '../Sequence';
import Phase, { GamePhase } from './phase';
import Pause from './pause';
import Rand from './rand';
import Clock from './clock';
import { DiceEvent } from '../../types';
import {
  PLUGIN_ID,
  dice,
  settings,
  OUTCOME_DONE,
  DiceOutcome,
  DiceLogEntry,
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
  [DiceEvent.climax]: 1,
  [DiceEvent.edge]: 1,
  [DiceEvent.randomPace]: 10,
  [DiceEvent.cleanUp]: 25,
  [DiceEvent.randomGrip]: 50,
  [DiceEvent.doublePace]: 50,
  [DiceEvent.halfPace]: 50,
  [DiceEvent.pause]: 50,
  [DiceEvent.risingPace]: 30,
};

const roll = Sequence.for(PLUGIN_ID, 'roll');

export default class Dealer {
  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Dealer',
    },

    activate: Composer.pipe(
      Composer.set(dice, { busy: false, log: [] }),
      ...outcomes.flatMap(o => (o.activate ? [o.activate] : [])),
      roll.after(1000, 'check')
    ),

    update: Composer.pipe(
      roll.on('check', () =>
        Composer.pipe(
          Phase.whenPhase(
            GamePhase.active,
            Composer.do(({ get, pipe }) => {
              const state = get(dice);
              if (state.busy) return;

              const s = get(settings);
              const frame = get();

              const eligible = outcomes.filter(o => {
                if (!s.events.includes(o.id)) return false;
                if (!rollChances[o.id]) return false;
                if (o.check && !o.check(frame)) return false;
                return true;
              });

              const guaranteed = eligible.find(o => rollChances[o.id] === 1);
              if (guaranteed) {
                pipe(roll.dispatch('trigger', guaranteed.id));
                return;
              }

              pipe(
                Rand.next(value => {
                  let cumulative = 0;
                  for (const outcome of eligible) {
                    cumulative += 1 / rollChances[outcome.id];
                    if (value < cumulative) {
                      return roll.dispatch('trigger', outcome.id);
                    }
                  }
                  return Composer.pipe();
                })
              );
            })
          ),
          roll.after(1000, 'check')
        )
      ),

      roll.on('trigger', event =>
        Composer.do(({ get, set, over, pipe }) => {
          set(dice.busy, true);
          const elapsed = get(Clock.paths)?.elapsed ?? 0;
          over(dice.log, (log: DiceLogEntry[]) => [
            ...log,
            { time: elapsed, event: event.payload },
          ]);
          pipe(
            Events.dispatch({ type: Events.getKey(PLUGIN_ID, event.payload) })
          );
        })
      ),

      ...outcomes.map(o => o.update),

      Events.handle(OUTCOME_DONE, () => Composer.set(dice.busy, false)),

      Phase.onLeave(GamePhase.active, () => Composer.set(dice.busy, false)),

      Pause.onPause(() => Scheduler.holdByPrefix(PLUGIN_ID)),
      Pause.onResume(() => Scheduler.releaseByPrefix(PLUGIN_ID))
    ),

    deactivate: Composer.set(dice, undefined),
  };

  static triggerOutcome(id: DiceEvent): Pipe {
    return roll.dispatch('trigger', id);
  }

  static get paths() {
    return dice;
  }
}

export { Paws, PawLabels, pawsPath } from './dice/randomGrip';
export { type DiceState } from './dice/types';
