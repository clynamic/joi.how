import type { Plugin } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { Composer } from '../../engine/Composer';
import { Events } from '../../engine/pipes/Events';
import { pluginPaths } from '../../engine/plugins/Plugins';
import { Sequence } from '../Sequence';
import { sdk } from '../../engine/sdk';
import Scene from './scene';

const PLUGIN_ID = 'core.pause';

export type PauseState = {
  paused: boolean;
  prev: boolean;
  countdown: number | null;
  gen: number;
};

const paths = pluginPaths<PauseState>(PLUGIN_ID);

const eventType = Events.getKeys(PLUGIN_ID, 'on', 'off');

type SetPayload = { paused: boolean };
type CountdownPayload = { remaining: number; gen: number };

const seq = Sequence.for(PLUGIN_ID, 'set');

export default class Pause {
  static setPaused(val: boolean): Pipe {
    return seq.start({ paused: val });
  }

  static get togglePause(): Pipe {
    return Composer.bind(paths.state, state => Pause.setPaused(!state?.paused));
  }

  static whenPaused(pipe: Pipe): Pipe {
    return Composer.bind(paths.state, state =>
      Composer.when(!!state?.paused, pipe)
    );
  }

  static whenPlaying(pipe: Pipe): Pipe {
    return Composer.bind(paths.state, state =>
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

    activate: Composer.set(paths.state, {
      paused: true,
      prev: true,
      countdown: null,
      gen: 0,
    }),

    update: Composer.pipe(
      Scene.onEnter('game', () => Pause.setPaused(false)),
      Scene.onLeave('game', () => Pause.setPaused(true)),

      Composer.do(({ get, set, pipe }) => {
        const { paused, prev } = get(paths.state);
        if (paused === prev) return;
        set(paths.state.prev, paused);
        pipe(Events.dispatch({ type: paused ? eventType.on : eventType.off }));
      }),

      seq.on<SetPayload>(event =>
        Composer.bind(paths.state.gen, (gen = 0) => {
          const next = gen + 1;
          return Composer.when(
            event.payload.paused,
            Composer.pipe(
              Composer.set(paths.state.gen, next),
              Composer.set(paths.state.paused, true),
              Composer.set(paths.state.countdown, null)
            ),
            Composer.pipe(
              Composer.set(paths.state.gen, next),
              Composer.set(paths.state.countdown, 3),
              seq.after(1000, 'countdown', { remaining: 2, gen: next })
            )
          );
        })
      ),

      seq.on<CountdownPayload>('countdown', event =>
        Composer.bind(paths.state.gen, gen =>
          Composer.when(
            event.payload.gen === gen,
            Composer.when(
              event.payload.remaining <= 0,
              Composer.pipe(
                Composer.set(paths.state.countdown, null),
                Composer.set(paths.state.paused, false)
              ),
              Composer.pipe(
                Composer.set(paths.state.countdown, event.payload.remaining),
                seq.after(1000, 'countdown', {
                  remaining: event.payload.remaining - 1,
                  gen,
                })
              )
            )
          )
        )
      )
    ),

    deactivate: Composer.set(paths.state, undefined),
  };

  static get paths() {
    return paths;
  }
}

declare module '../../engine/sdk' {
  interface PluginSDK {
    Pause: typeof Pause;
  }
}

sdk.Pause = Pause;
