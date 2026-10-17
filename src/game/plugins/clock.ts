import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import Pause from './pause';
import Saves from './saves';

const PLUGIN_ID = 'core.clock';

export type ClockState = {
  elapsed: number;
  lastWall: number | null;
};

const clock = pluginPaths<ClockState>(PLUGIN_ID);

const fresh = Composer.set(clock, { elapsed: 0, lastWall: null });

const Clock = definePlugin({
  sdk: 'Clock',
  id: PLUGIN_ID,
  meta: {
    name: 'Clock',
  },

  activate: fresh,

  update: Composer.pipe(
    Saves.onSave(PLUGIN_ID, get => ({ elapsed: get(clock).elapsed })),
    Saves.onLoad<{ elapsed: number }>(PLUGIN_ID, data =>
      data
        ? Composer.set(clock, { elapsed: data.elapsed, lastWall: null })
        : fresh
    ),
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
