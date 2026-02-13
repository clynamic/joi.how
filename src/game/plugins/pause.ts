import type { Plugin } from '../../engine/plugins/Plugins';
import { sdk } from '../../engine/sdk';
import { Composer } from '../../engine/Composer';
import { GameFrame, Pipe, PipeTransformer } from '../../engine/State';
import { Events, getEventKey } from '../../engine/pipes/Events';
import { pluginPaths } from '../../engine/plugins/Plugins';

declare module '../../engine/sdk' {
  interface PluginSDK {
    Pause: typeof Pause;
  }
}

const PLUGIN_ID = 'core.pause';

export type PauseState = {
  paused: boolean;
  prev: boolean;
};

type PauseContext = {
  setPaused: PipeTransformer<[boolean]>;
  togglePause: Pipe;
};

const pause = pluginPaths<PauseState, PauseContext>(PLUGIN_ID);

const eventType = {
  on: getEventKey(PLUGIN_ID, 'on'),
  off: getEventKey(PLUGIN_ID, 'off'),
};

export default class Pause {
  static setPaused(val: boolean): Pipe {
    return Composer.set<boolean>(pause.state.paused, val);
  }

  static get togglePause(): Pipe {
    return Composer.bind<PauseState>(pause.state, state =>
      Pause.setPaused(!state?.paused)
    );
  }

  static whenPaused(pipe: Pipe): Pipe {
    return Composer.bind<PauseState>(pause.state, state =>
      Composer.when(!!state?.paused, pipe)
    );
  }

  static whenPlaying(pipe: Pipe): Pipe {
    return Composer.bind<PauseState>(pause.state, state =>
      Composer.when(!state?.paused, pipe)
    );
  }

  static onPause(fn: () => Pipe): Pipe {
    return Events.handle(eventType.on, fn);
  }

  static onResume(fn: () => Pipe): Pipe {
    return Events.handle(eventType.off, fn);
  }

  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Pause',
      version: '0.1.0',
    },

    activate: frame => {
      sdk.Pause = Pause;
      return Composer.set(pause.state, { paused: false, prev: false })(frame);
    },

    update: Composer.pipe(
      Composer.set<PauseContext>(pause.context, {
        setPaused: val => Pause.setPaused(val),
        togglePause: Pause.togglePause,
      }),
      Composer.do<GameFrame>(({ get, set, pipe }) => {
        const { paused, prev } = get(pause.state);
        if (paused === prev) return;
        set(pause.state.prev, paused);
        pipe(Events.dispatch({ type: paused ? eventType.on : eventType.off }));
      })
    ),

    deactivate: Composer.pipe(
      Composer.set(pause.state, undefined),
      Composer.set(pause.context, undefined)
    ),
  };
}
