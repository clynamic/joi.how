import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { typedPath } from '../../engine/Lens';
import { Settings } from '../../settings/Settings';
import { Composer } from '../../engine';
import Clock from './clock';

const PLUGIN_ID = 'core.pace';

export type PaceEntry = { time: number; pace: number };

export type PaceState = {
  pace: number;
  prevMinPace: number;
  prevPace: number;
  history: PaceEntry[];
  lastRecorded: number;
};

const pace = pluginPaths<PaceState>(PLUGIN_ID);
const settings = typedPath<Settings>(['settings']);

const Pace = definePlugin({
  name: 'Pace',
  id: PLUGIN_ID,
  meta: {
    name: 'Pace',
  },

  setPace(val: number): Pipe {
    return Composer.set(pace.pace, val);
  },

  resetPace(): Pipe {
    return Composer.bind(settings, s => Composer.set(pace.pace, s.minPace));
  },

  activate: Composer.bind(settings, s =>
    Composer.set(pace, {
      pace: s.minPace,
      prevMinPace: s.minPace,
      prevPace: s.minPace,
      history: [{ time: 0, pace: s.minPace }],
      lastRecorded: 0,
    })
  ),

  update: Composer.do(({ get, set, over }) => {
    const state = get(pace);
    const { minPace } = get(settings);

    if (minPace !== state.prevMinPace) {
      set(pace.prevMinPace, minPace);
      set(pace.pace, minPace);
    }

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
  }),

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
