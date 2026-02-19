import type { Plugin } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { typedPath } from '../../engine/Lens';
import { Settings } from '../../settings';
import { Composer, pluginPaths } from '../../engine';
import Clock from './clock';

declare module '../../engine/sdk' {
  interface PluginSDK {
    Pace: typeof Pace;
  }
}

const PLUGIN_ID = 'core.pace';

export type PaceEntry = { time: number; pace: number };

export type PaceState = {
  pace: number;
  prevMinPace: number;
  prevPace: number;
  history: PaceEntry[];
};

const pace = pluginPaths<PaceState>(PLUGIN_ID);
const settings = typedPath<Settings>(['settings']);

export default class Pace {
  static setPace(val: number): Pipe {
    return Composer.set(pace.pace, val);
  }

  static resetPace(): Pipe {
    return Composer.bind(settings, s => Composer.set(pace.pace, s.minPace));
  }

  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Pace',
    },

    activate: Composer.bind(settings, s =>
      Composer.set(pace, {
        pace: s.minPace,
        prevMinPace: s.minPace,
        prevPace: s.minPace,
        history: [{ time: 0, pace: s.minPace }],
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
        const { elapsed } = get(Clock.paths) ?? { elapsed: 0 };
        set(pace.prevPace, state.pace);
        over(pace.history, (h: PaceEntry[]) => [
          ...h,
          { time: elapsed, pace: state.pace },
        ]);
      }
    }),

    deactivate: Composer.set(pace, undefined),
  };

  static get paths() {
    return pace;
  }
}
