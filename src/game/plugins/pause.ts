import type { Plugin } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { Composer } from '../../engine/Composer';
import { Events } from '../../engine/pipes/Events';
import { pluginPaths } from '../../engine/plugins/Plugins';
import { Sequence } from '../Sequence';

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

const pause = pluginPaths<PauseState>(PLUGIN_ID);

const eventType = Events.getKeys(PLUGIN_ID, 'on', 'off');

type CountdownPayload = { remaining: number };

const resume = Sequence.for(PLUGIN_ID, 'resume');

export default class Pause {
  static setPaused(val: boolean): Pipe {
    return Composer.when(
      val,
      Composer.pipe(resume.cancel(), Composer.set(pause.state.paused, true)),
      resume.start()
    );
  }

  static get togglePause(): Pipe {
    return Composer.bind(pause.state, state => Pause.setPaused(!state?.paused));
  }

  static whenPaused(pipe: Pipe): Pipe {
    return Composer.bind(pause.state, state =>
      Composer.when(!!state?.paused, pipe)
    );
  }

  static whenPlaying(pipe: Pipe): Pipe {
    return Composer.bind(pause.state, state =>
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
    },

    activate: Composer.set(pause.state, { paused: false, prev: false }),

    update: Composer.pipe(
      Composer.do(({ get, set, pipe }) => {
        const { paused, prev } = get(pause.state);
        if (paused === prev) return;
        set(pause.state.prev, paused);
        pipe(Events.dispatch({ type: paused ? eventType.on : eventType.off }));
      }),

      resume.on(() =>
        Composer.pipe(
          resume.message({
            title: 'Get ready to continue.',
            description: '3...',
          }),
          resume.after(1000, 'countdown', { remaining: 2 })
        )
      ),

      resume.on<CountdownPayload>('countdown', event =>
        Composer.when(
          event.payload.remaining <= 0,
          Composer.pipe(
            resume.message({
              title: 'Continue.',
              description: undefined,
              duration: 1500,
            }),
            Composer.set(pause.state.paused, false)
          ),
          Composer.pipe(
            resume.message({ description: `${event.payload.remaining}...` }),
            resume.after(1000, 'countdown', {
              remaining: event.payload.remaining - 1,
            })
          )
        )
      )
    ),

    deactivate: Composer.set(pause.state, undefined),
  };

  static get paths() {
    return pause;
  }
}
