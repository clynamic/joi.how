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
};

type ClockContext = {
  lastWall: number | null;
};

const clock = pluginPaths<ClockState, ClockContext>(PLUGIN_ID);

export default class Clock {
  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Clock',
    },

    activate: Composer.pipe(
      Composer.set(clock.state, { elapsed: 0 }),
      Composer.set(clock.context, { lastWall: null })
    ),

    update: Composer.pipe(
      Pause.whenPlaying(
        Composer.do(({ get, over, set }) => {
          const now = performance.now();
          const ctx = get(clock.context);
          if (ctx?.lastWall !== null && ctx?.lastWall !== undefined) {
            const delta = now - ctx.lastWall;
            over(clock.state, ({ elapsed = 0 }) => ({
              elapsed: elapsed + delta,
            }));
          }
          set(clock.context, { lastWall: now });
        })
      ),
      Pause.onPause(() =>
        Composer.set(clock.context, { lastWall: null })
      )
    ),

    deactivate: Composer.pipe(
      Composer.set(clock.state, undefined),
      Composer.set(clock.context, undefined)
    ),
  };

  static get paths() {
    return clock;
  }
}
