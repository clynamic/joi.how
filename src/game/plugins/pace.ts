import type { Plugin } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { typedPath } from '../../engine/Lens';
import { Settings } from '../../settings';
import { Composer, pluginPaths } from '../../engine';

declare module '../../engine/sdk' {
  interface PluginSDK {
    Pace: typeof Pace;
  }
}

const PLUGIN_ID = 'core.pace';

export type PaceState = {
  pace: number;
  prevMinPace: number;
};

const pace = pluginPaths<PaceState>(PLUGIN_ID);
const settings = typedPath<Settings>(['context', 'settings']);

export default class Pace {
  static setPace(val: number): Pipe {
    return Composer.set(pace.state.pace, val);
  }

  static resetPace(): Pipe {
    return Composer.bind(settings, s =>
      Composer.set(pace.state.pace, s.minPace)
    );
  }

  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Pace',
    },

    activate: Composer.bind(settings, s =>
      Composer.set(pace.state, { pace: s.minPace, prevMinPace: s.minPace })
    ),

    update: Composer.do(({ get, set }) => {
      const { prevMinPace } = get(pace.state);
      const { minPace } = get(settings);
      if (minPace === prevMinPace) return;
      set(pace.state.prevMinPace, minPace);
      set(pace.state.pace, minPace);
    }),

    deactivate: Composer.set(pace.state, undefined),
  };

  static get paths() {
    return pace;
  }
}
