import { Plugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { GameFrame, Pipe, PipeTransformer } from '../../engine/State';
import { Events, getEventKey } from '../../engine/pipes/Events';

const PLUGIN_ID = 'core.pause';

export type PauseState = {
  paused: boolean;
  prev: boolean;
};

type PauseContext = {
  setPaused: PipeTransformer<[boolean]>;
  togglePause: Pipe;
};

const paths = pluginPaths<PauseState, PauseContext>(PLUGIN_ID);

const eventType = {
  on: getEventKey(PLUGIN_ID, 'on'),
  off: getEventKey(PLUGIN_ID, 'off'),
};

export class Pause {
  static setPaused(val: boolean): Pipe {
    return Composer.set<boolean>(paths.state.paused, val);
  }

  static get togglePause(): Pipe {
    return Composer.bind<PauseState>(paths.state, ({ paused }) =>
      Pause.setPaused(!paused)
    );
  }

  static whenPaused(pipe: Pipe): Pipe {
    return Composer.bind<PauseState>(paths.state, ({ paused }) =>
      Composer.when(paused, pipe)
    );
  }

  static whenPlaying(pipe: Pipe): Pipe {
    return Composer.bind<PauseState>(paths.state, ({ paused }) =>
      Composer.when(!paused, pipe)
    );
  }

  static onPause(fn: () => Pipe): Pipe {
    return Events.handle(eventType.on, fn);
  }

  static onResume(fn: () => Pipe): Pipe {
    return Events.handle(eventType.off, fn);
  }
}

export function createPausePlugin(): Plugin {
  return {
    id: PLUGIN_ID,
    meta: {
      name: 'Pause',
      version: '0.1.0',
    },

    activate: Composer.set(paths.state, { paused: false, prev: false }),

    update: Composer.pipe(
      Composer.set<PauseContext>(paths.context, {
        setPaused: val => Pause.setPaused(val),
        togglePause: Pause.togglePause,
      }),
      Composer.do<GameFrame>(({ get, set, pipe }) => {
        const { paused, prev } = get(paths.state);
        if (paused === prev) return;
        set(paths.state.prev, paused);
        pipe(Events.dispatch({ type: paused ? eventType.on : eventType.off }));
      })
    ),

    deactivate: Composer.pipe(
      Composer.set(paths.state, undefined),
      Composer.set(paths.context, undefined)
    ),
  };
}
