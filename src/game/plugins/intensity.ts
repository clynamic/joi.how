import type { Plugin } from '../../engine/plugins/Plugins';
import { sdk } from '../../engine/sdk';
import { typedPath } from '../../engine/Lens';
import { Settings } from '../../settings';
import Phase, { GamePhase } from './phase';
import Pause from './pause';
import { GameContext } from '../../engine';

const { Composer, pluginPaths } = sdk;

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
const gameContext = typedPath<GameContext>(['context']);
const settings = typedPath<Settings>(gameContext.settings);

export default class Intensity {
  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Intensity',
    },

    activate: Composer.set(intensity.state, { intensity: 0 }),

    update: Pause.whenPlaying(
      Phase.whenPhase(
        GamePhase.active,
        Composer.do(({ get, over }) => {
          const delta = get(gameContext.deltaTime);
          const s = get(settings);
          over(intensity.state, ({ intensity: i = 0 }) => ({
            intensity: Math.min(1, i + delta / (s.gameDuration * 1000)),
          }));
        })
      )
    ),

    deactivate: Composer.set(intensity.state, undefined),
  };
}
