import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { Composer } from '../../engine/Composer';
import { Events } from '../../engine/pipes/Events';
import { Sequence } from '../Sequence';
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

const Pause = definePlugin({
  name: 'Pause',
  id: PLUGIN_ID,
  meta: {
    name: 'Pause',
  },

  setPaused(val: boolean): Pipe {
    return seq.start({ paused: val });
  },

  get togglePause(): Pipe {
    return Composer.bind(paths, state => seq.start({ paused: !state?.paused }));
  },

  whenPaused(pipe: Pipe): Pipe {
    return Composer.bind(paths, state => Composer.when(!!state?.paused, pipe));
  },

  whenPlaying(pipe: Pipe): Pipe {
    return Composer.bind(paths, state => Composer.when(!state?.paused, pipe));
  },

  onPause(fn: () => Pipe): Pipe {
    return Events.handle(eventType.on, fn);
  },

  onResume(fn: () => Pipe): Pipe {
    return Events.handle(eventType.off, fn);
  },

  activate: Composer.set(paths, {
    paused: true,
    prev: true,
    countdown: null,
    gen: 0,
  }),

  update: Composer.pipe(
    Scene.onEnter('game', () => seq.start({ paused: false })),
    Scene.onLeave('game', () => seq.start({ paused: true })),

    Composer.do(({ get, set, pipe }) => {
      const { paused, prev } = get(paths);
      if (paused === prev) return;
      set(paths.prev, paused);
      pipe(Events.dispatch({ type: paused ? eventType.on : eventType.off }));
    }),

    seq.on<SetPayload>(event =>
      Composer.bind(paths.gen, (gen = 0) => {
        const next = gen + 1;
        return Composer.when(
          event.payload.paused,
          Composer.pipe(
            Composer.set(paths.gen, next),
            Composer.set(paths.paused, true),
            Composer.set(paths.countdown, null)
          ),
          Composer.pipe(
            Composer.set(paths.gen, next),
            Composer.set(paths.countdown, 3),
            seq.after(1000, 'countdown', { remaining: 2, gen: next })
          )
        );
      })
    ),

    seq.on<CountdownPayload>('countdown', event =>
      Composer.bind(paths.gen, gen =>
        Composer.when(
          event.payload.gen === gen,
          Composer.when(
            event.payload.remaining <= 0,
            Composer.pipe(
              Composer.set(paths.countdown, null),
              Composer.set(paths.paused, false)
            ),
            Composer.pipe(
              Composer.set(paths.countdown, event.payload.remaining),
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

  deactivate: Composer.set(paths, undefined),

  get paths() {
    return paths;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Pause: typeof Pause;
  }
}

export default Pause;
