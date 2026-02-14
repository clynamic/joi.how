import type { Plugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { Events } from '../../engine/pipes/Events';
import { Scheduler } from '../../engine/pipes/Scheduler';
import { Sequence } from '../Sequence';
import Phase, { GamePhase } from './phase';
import Pause from './pause';
import { GameEvent as GameEventType } from '../../types';
import {
  PLUGIN_ID,
  dice,
  settings,
  OUTCOME_DONE,
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
  Events.getKey(PLUGIN_ID, id);

const roll = Sequence.for(PLUGIN_ID, 'roll');

export default class Dealer {
  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Dealer',
    },

    activate: Composer.pipe(
      Composer.set(dice.state, { busy: false }),
      Composer.bind(settings, s =>
        Composer.pipe(
          ...outcomes.flatMap(o =>
            o.activate && s?.events.includes(o.id) ? [o.activate] : []
          )
        )
      ),
      roll.after(1000, 'check')
    ),

    update: Composer.pipe(
      roll.on('check', () =>
        Composer.pipe(
          Phase.whenPhase(
            GamePhase.active,
            Composer.do(({ get, set, pipe }) => {
              const state = get(dice.state);
              if (!state || state.busy) return;

              const s = get(settings);
              if (!s) return;

              const frame = get();

              for (const outcome of outcomes) {
                if (!s.events.includes(outcome.id)) continue;
                if (outcome.check && !outcome.check(frame)) continue;

                const chance = rollChances[outcome.id];
                if (chance && Math.floor(Math.random() * chance) !== 0)
                  continue;

                set(dice.state.busy, true);
                pipe(Events.dispatch({ type: eventKeyForOutcome(outcome.id) }));
                return;
              }
            })
          ),
          roll.after(1000, 'check')
        )
      ),

      ...outcomes.map(o => o.update),

      Events.handle(OUTCOME_DONE, () => Composer.set(dice.state.busy, false)),

      Phase.onLeave(GamePhase.active, () =>
        Composer.set(dice.state.busy, false)
      ),

      Pause.onPause(() => Scheduler.holdByPrefix(PLUGIN_ID)),
      Pause.onResume(() => Scheduler.releaseByPrefix(PLUGIN_ID))
    ),

    deactivate: Composer.set(dice.state, undefined),
  };

  static get paths() {
    return dice;
  }
}

export { Paws, PawLabels, pawsPath } from './dice/randomGrip';
export { type DiceState } from './dice/types';
