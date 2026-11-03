import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { GameFrame, Pipe } from '../../engine/State';
import { Composer } from '../../engine';
import Clock from './clock';
import Saves from './saves';
import Presets from './presets';

const PLUGIN_ID = 'how.joi.classic.pace';

export type PaceEntry = { time: number; pace: number };

export type PaceState = {
  pace: number;
  prevPace: number;
  history: PaceEntry[];
  lastRecorded: number;
};

const pace = pluginPaths<PaceState>(PLUGIN_ID);

export const paceKeys = Presets.keys(PLUGIN_ID, {
  minPace: 1,
  maxPace: 5,
  steepness: 0.5,
  timeshift: 0.5,
});

export type PaceBounds = { min: number; max: number };

const boundsOf = (frame: GameFrame): PaceBounds => {
  const { minPace, maxPace } = paceKeys.get(frame);
  return { min: minPace, max: Math.max(minPace, maxPace) };
};

const fresh: Pipe = Composer.do<GameFrame>(({ get, set }) => {
  const { min } = boundsOf(get());
  set(pace, {
    pace: min,
    prevPace: min,
    history: [{ time: 0, pace: min }],
    lastRecorded: 0,
  });
});

const Pace = definePlugin({
  sdk: 'Pace',
  id: PLUGIN_ID,
  meta: {
    name: 'Pace',
  },

  setPace(val: number): Pipe {
    return Composer.set(pace.pace, val);
  },

  resetPace(): Pipe {
    return Composer.do<GameFrame>(({ get, set }) => {
      set(pace.pace, boundsOf(get()).min);
    });
  },

  bounds(frame: GameFrame): PaceBounds {
    return boundsOf(frame);
  },

  get keys() {
    return paceKeys;
  },

  activate: fresh,

  update: Composer.pipe(
    Saves.onSave(PLUGIN_ID, get => get(pace)),
    Saves.onLoad<PaceState>(PLUGIN_ID, data =>
      data ? Composer.set(pace, data) : fresh
    ),
    Composer.do(({ get, set, over }) => {
      const state = get(pace);
      const { min, max } = boundsOf(get());
      const clamped = Math.min(max, Math.max(min, state.pace));
      if (clamped !== state.pace) set(pace.pace, clamped);

      if (state.pace !== state.prevPace) {
        set(pace.prevPace, state.pace);
        const { elapsed } = get(Clock.paths) ?? { elapsed: 0 };
        if (elapsed - state.lastRecorded >= 1000) {
          set(pace.lastRecorded, elapsed);
          over(pace.history, (h: PaceEntry[]) => [
            ...h,
            { time: elapsed, pace: state.pace },
          ]);
        }
      }
    })
  ),

  deactivate: Composer.set(pace, undefined),

  get paths() {
    return pace;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Pace: typeof Pace;
  }
}

export default Pace;
