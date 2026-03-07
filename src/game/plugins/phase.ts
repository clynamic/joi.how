import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { Events } from '../../engine/pipes/Events';
import { Composer } from '../../engine';

const PLUGIN_ID = 'core.phase';

export enum GamePhase {
  warmup = 'warmup',
  active = 'active',
  break = 'break',
  finale = 'finale',
  climax = 'climax',
}

export type PhaseState = {
  current: string;
  prev: string;
};

const phase = pluginPaths<PhaseState>(PLUGIN_ID);

const eventType = {
  enter: (p: string) => Events.getKey(PLUGIN_ID, `enter/${p}`),
  leave: (p: string) => Events.getKey(PLUGIN_ID, `leave/${p}`),
};

const Phase = definePlugin({
  name: 'Phase',
  id: PLUGIN_ID,
  meta: {
    name: 'Phase',
  },

  setPhase(p: string): Pipe {
    return Composer.set(phase.current, p);
  },

  whenPhase(p: string, pipe: Pipe): Pipe {
    return Composer.bind(phase, state =>
      Composer.when(state?.current === p, pipe)
    );
  },

  onEnter(p: string, fn: () => Pipe): Pipe {
    return Events.handle(eventType.enter(p), fn);
  },

  onLeave(p: string, fn: () => Pipe): Pipe {
    return Events.handle(eventType.leave(p), fn);
  },

  activate: Composer.set(phase, {
    current: GamePhase.warmup,
    prev: GamePhase.warmup,
  }),

  update: Composer.do(({ get, set, pipe }) => {
    const { current, prev } = get(phase);
    if (current === prev) return;
    set(phase.prev, current);
    pipe(Events.dispatch({ type: eventType.leave(prev) }));
    pipe(Events.dispatch({ type: eventType.enter(current) }));
  }),

  deactivate: Composer.set(phase, undefined),

  get paths() {
    return phase;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Phase: typeof Phase;
  }
}

export default Phase;
