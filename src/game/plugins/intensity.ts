import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { typedPath } from '../../engine/Lens';
import Presets from './presets';
import { GameTiming } from '../../engine/State';
import Phase, { GamePhase } from './phase';
import Pause from './pause';
import Saves from './saves';

const PLUGIN_ID = 'how.joi.classic.intensity';

export type IntensityState = {
  intensity: number;
};

const intensity = pluginPaths<IntensityState>(PLUGIN_ID);
const timing = typedPath<GameTiming>([]);
export const intensityKeys = Presets.keys(PLUGIN_ID, { gameDuration: 900 });

const fresh = Composer.set(intensity, { intensity: 0 });

const Intensity = definePlugin({
  sdk: 'Intensity',
  id: PLUGIN_ID,
  meta: {
    name: 'Intensity',
  },

  activate: fresh,

  update: Composer.pipe(
    Saves.onSave(PLUGIN_ID, get => get(intensity)),
    Saves.onLoad<IntensityState>(PLUGIN_ID, data =>
      data ? Composer.set(intensity, data) : fresh
    ),
    Pause.whenPlaying(
      Phase.whenPhase(
        GamePhase.active,
        Composer.do(({ get, over }) => {
          const delta = get(timing.step);
          const s = intensityKeys.get(get());
          over(intensity, ({ intensity: i = 0 }) => ({
            intensity: Math.min(1, i + delta / (s.gameDuration * 1000)),
          }));
        })
      )
    )
  ),

  deactivate: Composer.set(intensity, undefined),

  get paths() {
    return intensity;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Intensity: typeof Intensity;
  }
}

export default Intensity;
