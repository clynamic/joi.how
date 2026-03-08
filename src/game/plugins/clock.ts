import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import Pause from './pause';

const PLUGIN_ID = 'core.clock';

export type ClockState = {
  elapsed: number;
  lastWall: number | null;
};

const clock = pluginPaths<ClockState>(PLUGIN_ID);

const Clock = definePlugin({
  name: 'Clock',
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

  get paths() {
    return clock;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Clock: typeof Clock;
  }
}

export default Clock;
