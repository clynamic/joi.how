import type { Plugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { pluginPaths } from '../../engine/plugins/Plugins';
import Pause from './pause';

declare module '../../engine/sdk' {
  interface PluginSDK {
    Clock: typeof Clock;
  }
}

const PLUGIN_ID = 'core.clock';

export type ClockState = {
  elapsed: number;
  lastWall: number | null;
};

const clock = pluginPaths<ClockState>(PLUGIN_ID);

export default class Clock {
  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Clock',
    },

    activate: Composer.set(clock, { elapsed: 0, lastWall: null }),

    update: Composer.pipe(
      Pause.whenPlaying(
        Composer.do(({ get, over, set }) => {
          const now = performance.now();
          const state = get(clock);
          if (state?.lastWall !== null && state?.lastWall !== undefined) {
            const delta = now - state.lastWall;
            over(clock, ({ elapsed = 0, ...rest }) => ({
              ...rest,
              elapsed: elapsed + delta,
            }));
          }
          set(clock.lastWall, now);
        })
      ),
      Pause.onPause(() => Composer.set(clock.lastWall, null))
    ),

    deactivate: Composer.set(clock, undefined),
  };

  static get paths() {
    return clock;
  }
}
