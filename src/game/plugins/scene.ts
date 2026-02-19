import { pluginPaths, type Plugin } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { Events } from '../../engine/pipes/Events';
import { Composer } from '../../engine';
import { sdk } from '../../engine/sdk';

declare module '../../engine/sdk' {
  interface PluginSDK {
    Scene: typeof Scene;
  }
}

const PLUGIN_ID = 'core.scene';

export type SceneState = {
  current: string;
  prev: string;
};

const scene = pluginPaths<SceneState>(PLUGIN_ID);

const eventType = {
  enter: (s: string) => Events.getKey(PLUGIN_ID, `enter/${s}`),
  leave: (s: string) => Events.getKey(PLUGIN_ID, `leave/${s}`),
};

export default class Scene {
  static setScene(s: string): Pipe {
    return Composer.set(scene.current, s);
  }

  static whenScene(s: string, pipe: Pipe): Pipe {
    return Composer.bind(scene, state =>
      Composer.when(state?.current === s, pipe)
    );
  }

  static onEnter(s: string, fn: () => Pipe): Pipe {
    return Events.handle(eventType.enter(s), fn);
  }

  static onLeave(s: string, fn: () => Pipe): Pipe {
    return Events.handle(eventType.leave(s), fn);
  }

  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Scene',
    },

    activate: Composer.set(scene, {
      current: 'unknown',
      prev: 'unknown',
    }),

    update: Composer.do(({ get, set, pipe }) => {
      const { current, prev } = get(scene);
      if (current === prev) return;
      set(scene.prev, current);
      pipe(Events.dispatch({ type: eventType.leave(prev) }));
      pipe(Events.dispatch({ type: eventType.enter(current) }));
    }),

    deactivate: Composer.set(scene, undefined),
  };

  static get paths() {
    return scene;
  }
}

sdk.Scene = Scene;
