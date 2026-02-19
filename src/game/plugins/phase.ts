import { pluginPaths, type Plugin } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { Events } from '../../engine/pipes/Events';
import { Composer } from '../../engine';

declare module '../../engine/sdk' {
  interface PluginSDK {
    Phase: typeof Phase;
  }
}

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

export default class Phase {
  static setPhase(p: string): Pipe {
    return Composer.set(phase.current, p);
  }

  static whenPhase(p: string, pipe: Pipe): Pipe {
    return Composer.bind(phase, state =>
      Composer.when(state?.current === p, pipe)
    );
  }

  static onEnter(p: string, fn: () => Pipe): Pipe {
    return Events.handle(eventType.enter(p), fn);
  }

  static onLeave(p: string, fn: () => Pipe): Pipe {
    return Events.handle(eventType.leave(p), fn);
  }

  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Phase',
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
  };

  static get paths() {
    return phase;
  }
}
