import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { Events } from '../../engine/pipes/Events';
import { Composer } from '../../engine';

const PLUGIN_ID = 'core.mode';

export type ModeState = {
  current: string;
  prev: string;
};

const mode = pluginPaths<ModeState>(PLUGIN_ID);

const eventType = {
  enter: (m: string) => Events.getKey(PLUGIN_ID, `enter/${m}`),
  leave: (m: string) => Events.getKey(PLUGIN_ID, `leave/${m}`),
};

const Mode = definePlugin({
  name: 'Mode',
  id: PLUGIN_ID,
  meta: {
    name: 'Mode',
  },

  setMode(m: string): Pipe {
    return Composer.set(mode.current, m);
  },

  whenMode(m: string, pipe: Pipe): Pipe {
    return Composer.bind(mode, state =>
      Composer.when(state?.current === m, pipe)
    );
  },

  onEnter(m: string, fn: () => Pipe): Pipe {
    return Events.handle(eventType.enter(m), fn);
  },

  onLeave(m: string, fn: () => Pipe): Pipe {
    return Events.handle(eventType.leave(m), fn);
  },

  activate: Composer.set(mode, {
    current: 'classic',
    prev: '',
  }),

  update: Composer.do(({ get, set, pipe }) => {
    const { current, prev } = get(mode);
    if (current === prev) return;
    set(mode.prev, current);
    pipe(Events.dispatch({ type: eventType.leave(prev) }));
    pipe(Events.dispatch({ type: eventType.enter(current) }));
  }),

  deactivate: Composer.set(mode, undefined),

  get paths() {
    return mode;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Mode: typeof Mode;
  }
}

export default Mode;
