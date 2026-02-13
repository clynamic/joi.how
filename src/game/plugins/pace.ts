import type { Plugin } from '../../engine/plugins/Plugins';
import { Pipe, PipeTransformer } from '../../engine/State';
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
};

export type PaceContext = {
  setPace: PipeTransformer<[number]>;
  resetPace: PipeTransformer<[]>;
};

const pace = pluginPaths<PaceState, PaceContext>(PLUGIN_ID);
const settings = typedPath<Settings>(['context', 'settings']);

export default class Pace {
  static setPace(val: number): Pipe {
    return Composer.call(pace.context.setPace, val);
  }

  static resetPace(): Pipe {
    return Composer.call(pace.context.resetPace);
  }

  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Pace',
    },

    activate: Composer.pipe(
      Composer.bind(settings, s =>
        Composer.set(pace.state, { pace: s.minPace })
      ),
      Composer.set(pace.context, {
        setPace: (val: number) => Composer.set(pace.state.pace, val),
        resetPace: () =>
          Composer.bind(settings, s =>
            Composer.set(pace.state.pace, s.minPace)
          ),
      })
    ),

    deactivate: Composer.pipe(
      Composer.set(pace.state, undefined),
      Composer.set(pace.context, undefined)
    ),
  };
}
