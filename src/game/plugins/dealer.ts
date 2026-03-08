import { definePlugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { Pipe, GameFrame } from '../../engine/State';
import { Events } from '../../engine/pipes/Events';
import { Scheduler } from '../../engine/pipes/Scheduler';
import { ModuleManager } from '../../engine/modules/ModuleManager';
import { Module } from '../../engine/modules/Module';
import { Sequence } from '../Sequence';
import Mode from './mode';
import Phase, { GamePhase } from './phase';
import Pause from './pause';
import Rand from './rand';
import Clock from './clock';
import RandomImages from './randomImages';
import { DiceEvent } from '../../types';
import {
  PLUGIN_ID,
  dice,
  settings,
  intensityState,
  OUTCOME_DONE,
  DiceLogEntry,
} from './dice/types';
import { pauseModule } from './dice/pause';
import { randomPaceModule } from './dice/randomPace';
import { doublePaceModule } from './dice/doublePace';
import { halfPaceModule } from './dice/halfPace';
import { risingPaceModule } from './dice/risingPace';
import { randomGripModule } from './dice/randomGrip';
import { cleanUpModule } from './dice/cleanUp';
import { climaxModule } from './dice/climax';

type OutcomeEntry = {
  module: Module;
  event: DiceEvent;
  chance: number;
  check?: (get: Composer<GameFrame>['get']) => boolean;
};

const intensity = (get: Composer<GameFrame>['get']) =>
  get(intensityState).intensity * 100;

const outcomes: OutcomeEntry[] = [
  {
    module: climaxModule,
    event: DiceEvent.climax,
    chance: 1,
    check: get => intensity(get) >= 100,
  },
  { module: randomPaceModule, event: DiceEvent.randomPace, chance: 10 },
  {
    module: cleanUpModule,
    event: DiceEvent.cleanUp,
    chance: 25,
    check: get => intensity(get) >= 75,
  },
  { module: randomGripModule, event: DiceEvent.randomGrip, chance: 50 },
  {
    module: doublePaceModule,
    event: DiceEvent.doublePace,
    chance: 50,
    check: get => intensity(get) >= 20,
  },
  {
    module: halfPaceModule,
    event: DiceEvent.halfPace,
    chance: 50,
    check: get => {
      const i = intensity(get);
      return i >= 10 && i <= 50;
    },
  },
  {
    module: pauseModule,
    event: DiceEvent.pause,
    chance: 50,
    check: get => intensity(get) >= 15,
  },
  {
    module: risingPaceModule,
    event: DiceEvent.risingPace,
    chance: 30,
    check: get => intensity(get) >= 30,
  },
];

const roll = Sequence.for(PLUGIN_ID, 'roll');

const Dealer = definePlugin({
  name: 'Dealer',
  id: PLUGIN_ID,
  meta: {
    name: 'Dealer',
  },
  ordering: {
    loadAfter: ['core.mode'],
  },

  triggerOutcome(id: DiceEvent): Pipe {
    return roll.dispatch('trigger', id);
  },

  activate: Composer.pipe(
    Composer.set(dice, { busy: false, log: [] }),
    ...outcomes.map(o => ModuleManager.load(o.module))
  ),

  update: Composer.pipe(
    Mode.onEnter('classic', () =>
      Composer.pipe(RandomImages.start(), roll.after(1000, 'check'))
    ),

    Mode.onLeave('classic', () =>
      Composer.pipe(RandomImages.stop(), Composer.set(dice.busy, false))
    ),

    roll.on('check', () =>
      Composer.pipe(
        Mode.whenMode(
          'classic',
          Phase.whenPhase(
            GamePhase.active,
            Composer.do(({ get, pipe }) => {
              const state = get(dice);
              if (state.busy) return;

              const s = get(settings);

              const eligible = outcomes.filter(o => {
                if (!s.events.includes(o.event)) return false;
                if (o.check && !o.check(get)) return false;
                return true;
              });

              const guaranteed = eligible.find(o => o.chance === 1);
              if (guaranteed) {
                pipe(roll.dispatch('trigger', guaranteed.event));
                return;
              }

              pipe(
                Rand.next(value => {
                  let cumulative = 0;
                  for (const outcome of eligible) {
                    cumulative += 1 / outcome.chance;
                    if (value < cumulative) {
                      return roll.dispatch('trigger', outcome.event);
                    }
                  }
                  return Composer.pipe();
                })
              );
            })
          )
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

    Events.handle(OUTCOME_DONE, () => Composer.set(dice.busy, false)),

    Phase.onLeave(GamePhase.active, () => Composer.set(dice.busy, false)),

    Pause.onPause(() => Scheduler.holdByPrefix(PLUGIN_ID)),
    Pause.onResume(() => Scheduler.releaseByPrefix(PLUGIN_ID))
  ),

  deactivate: Composer.pipe(
    ...outcomes.map(o => ModuleManager.unload(o.module.id)),
    Composer.set(dice, undefined)
  ),

  get paths() {
    return dice;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Dealer: typeof Dealer;
  }
}

export default Dealer;

export { Paws, PawLabels, pawsPath } from './dice/randomGrip';
export { type DiceState } from './dice/types';
