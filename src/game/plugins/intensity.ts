import type { Plugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { pluginPaths } from '../../engine/plugins/Plugins';
import { typedPath } from '../../engine/Lens';
import { Settings } from '../../settings';
import { GameTiming } from '../../engine/State';
import Phase, { GamePhase } from './phase';
import Pause from './pause';

declare module '../../engine/sdk' {
  interface PluginSDK {
    Intensity: typeof Intensity;
  }
}

const PLUGIN_ID = 'core.intensity';

export type IntensityState = {
  intensity: number;
};

const intensity = pluginPaths<IntensityState>(PLUGIN_ID);
const timing = typedPath<GameTiming>([]);
const settings = typedPath<Settings>(['settings']);

export default class Intensity {
  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Intensity',
    },

    activate: Composer.set(intensity, { intensity: 0 }),

    update: Pause.whenPlaying(
      Phase.whenPhase(
        GamePhase.active,
        Composer.do(({ get, over }) => {
          const delta = get(timing.step);
          const s = get(settings);
          over(intensity, ({ intensity: i = 0 }) => ({
            intensity: Math.min(1, i + delta / (s.gameDuration * 1000)),
          }));
        })
      )
    ),

    deactivate: Composer.set(intensity, undefined),
  };

  static get paths() {
    return intensity;
  }
}
