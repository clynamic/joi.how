import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { Events } from '../../engine/pipes/Events';
import { Composer } from '../../engine';
import { Log } from '../../engine/pipes/Log';
import { GameFrame } from '../../engine/State';
import { ModuleManager } from '../../engine/modules/ModuleManager';

const PLUGIN_ID = 'how.joi.mode';

export type ModeInfo = {
  id: string;
  name: string;
  description?: string;
};

export type ModeState = {
  current: string;
  prev: string;
  modes: Record<string, ModeInfo>;
};

const mode = pluginPaths<ModeState>(PLUGIN_ID);

const initial: ModeState = { current: 'classic', prev: 'classic', modes: {} };

const eventType = {
  enter: (m: string) => Events.getKey(PLUGIN_ID, `enter/${m}`),
  leave: (m: string) => Events.getKey(PLUGIN_ID, `leave/${m}`),
};

const Mode = definePlugin({
  sdk: 'Mode',
  id: PLUGIN_ID,
  meta: {
    name: 'Mode',
  },

  register(info: ModeInfo): Pipe {
    return Composer.over(
      mode.modes,
      modes => ({ ...modes, [info.id]: info }),
      {}
    );
  },

  unregister(id: string): Pipe {
    return Composer.pipe(
      Composer.over(
        mode.modes,
        modes =>
          Object.fromEntries(
            Object.entries(modes).filter(([key]) => key !== id)
          ),
        {}
      ),
      Composer.do(({ get, set }) => {
        const { current, modes } = get(mode);
        const [remaining] = Object.keys(modes);
        if (current === id && remaining) set(mode.current, remaining);
      })
    );
  },

  setMode(m: string): Pipe {
    return Composer.do(({ get, set, pipe }) => {
      if (!(m in (get(mode)?.modes ?? {}))) {
        pipe(Log.warn(PLUGIN_ID, 'mode {mode} is not registered', { mode: m }));
        return;
      }
      set(mode.current, m);
    });
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

  activate: Composer.bind(mode, state =>
    Composer.when(!state, Composer.set(mode, initial))
  ),

  update: Composer.do(({ get, set, pipe }) => {
    const { current, prev } = get(mode);
    if (current === prev) return;
    set(mode.prev, current);
    pipe(Events.dispatch({ type: eventType.leave(prev) }));
    pipe(Events.dispatch({ type: eventType.enter(current) }));
  }),

  deactivate: Composer.do<GameFrame>(({ get, set }) => {
    if (ModuleManager.replacing(get(), PLUGIN_ID)) return;
    set(mode, undefined);
  }),

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
