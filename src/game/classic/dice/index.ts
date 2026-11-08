import { definePlugin } from '../../../engine/plugins/Plugins';
import { Composer } from '../../../engine/Composer';
import { Pipe, GameFrame } from '../../../engine/State';
import { Events } from '../../../engine/pipes/Events';
import { ModuleManager } from '../../../engine/modules/ModuleManager';
import { ScheduledEvent, Scheduler } from '../../../engine/pipes/Scheduler';
import Saves from '../../saves';
import { Module } from '../../../engine/modules/Module';
import { Sequence } from '../../Sequence';
import Phase, { GamePhase } from '../../phase';
import Rand from '../../rand';
import Clock from '../clock';
import { DiceEvent } from './events';
import {
  PLUGIN_ID,
  dice,
  intensityState,
  OUTCOME_DONE,
  DiceLogEntry,
  DiceState,
} from './types';
import Presets from '../../presets';
import { pauseModule } from './pause';
import { randomPaceModule } from './randomPace';
import { doublePaceChance, doublePaceModule } from './doublePace';
import { halfPaceModule } from './halfPace';
import { risingPaceModule } from './risingPace';
import { randomGripModule } from './randomGrip';
import { cleanUpModule } from './cleanUp';
import { climaxModule } from './climax';

type Getter = Composer<GameFrame>['get'];

type OutcomeEntry = {
  module: Module;
  event: DiceEvent;
  chance: number | ((get: Getter) => number);
  check?: (get: Getter) => boolean;
};

export const dealerKeys = Presets.keys(PLUGIN_ID, {
  events: Object.values(DiceEvent) as DiceEvent[],
});
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
    chance: get => doublePaceChance(intensity(get)),
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

const fresh = Composer.pipe(
  Composer.set(dice, { busy: false, log: [] }),
  Scheduler.cancelByPrefix(PLUGIN_ID),
  ...outcomes.map(o => ModuleManager.reload(o.module.id)),
  roll.after(1000, 'check')
);

const Dealer = definePlugin({
  sdk: 'Dealer',
  id: PLUGIN_ID,
  meta: {
    name: 'Dealer',
  },
  ordering: {
    loadAfter: ['how.joi.mode'],
  },

  events: DiceEvent,

  triggerOutcome(id: DiceEvent): Pipe {
    return roll.dispatch('trigger', id);
  },

  onOutcome(fn: (event: DiceEvent) => Pipe): Pipe {
    return roll.on<DiceEvent>('trigger', event => fn(event.payload));
  },

  activate: Composer.pipe(
    Composer.set(dice, { busy: false, log: [] }),
    ...outcomes.map(o => ModuleManager.load(o.module)),
    roll.after(1000, 'check')
  ),

  update: Composer.pipe(
    Saves.onSave(PLUGIN_ID, get => ({
      state: get(dice),
      timers: Scheduler.snapshot(get(), PLUGIN_ID),
    })),
    Saves.onLoad<{ state: DiceState; timers: ScheduledEvent[] }>(
      PLUGIN_ID,
      data =>
        data
          ? Composer.pipe(
              Composer.set(dice, data.state),
              Scheduler.restore(PLUGIN_ID, data.timers)
            )
          : fresh
    ),
    roll.on('check', () =>
      Composer.pipe(
        Phase.whenPhase(
          GamePhase.active,
          Composer.do(({ get, pipe, take }) => {
            const state = get(dice);
            if (state.busy) return;

            const s = dealerKeys.get(get());

            const eligible = outcomes.filter(o => {
              if (!s.events.includes(o.event)) return false;
              if (o.check && !o.check(get)) return false;
              return true;
            });

            const chanceOf = (o: OutcomeEntry) =>
              typeof o.chance === 'function' ? o.chance(get) : o.chance;

            const guaranteed = eligible.find(o => chanceOf(o) === 1);
            if (guaranteed) {
              pipe(roll.dispatch('trigger', guaranteed.event));
              return;
            }

            const value = take(Rand.next);
            let cumulative = 0;
            for (const outcome of eligible) {
              cumulative += 1 / chanceOf(outcome);
              if (value < cumulative) {
                pipe(roll.dispatch('trigger', outcome.event));
                return;
              }
            }
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

    Events.handle(OUTCOME_DONE, () => Composer.set(dice.busy, false)),

    Phase.onLeave(GamePhase.active, () => Composer.set(dice.busy, false))
  ),

  deactivate: Composer.pipe(
    ...outcomes.map(o => ModuleManager.unload(o.module.id)),
    roll.cancel(),
    Composer.set(dice, undefined)
  ),

  get paths() {
    return dice;
  },
});

declare module '../../../engine/sdk' {
  interface PluginSDK {
    Dealer: typeof Dealer;
  }
}

export default Dealer;

export { Paws, PawLabels, pawsPath } from './randomGrip';
export { type DiceState } from './types';
