import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { Events } from '../../engine/pipes/Events';
import { Composer } from '../../engine';

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

const Scene = definePlugin({
  name: 'Scene',
  id: PLUGIN_ID,
  meta: {
    name: 'Scene',
  },

  setScene(s: string): Pipe {
    return Composer.set(scene.current, s);
  },

  whenScene(s: string, pipe: Pipe): Pipe {
    return Composer.bind(scene, state =>
      Composer.when(state?.current === s, pipe)
    );
  },

  onEnter(s: string, fn: () => Pipe): Pipe {
    return Events.handle(eventType.enter(s), fn);
  },

  onLeave(s: string, fn: () => Pipe): Pipe {
    return Events.handle(eventType.leave(s), fn);
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

  get paths() {
    return scene;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Scene: typeof Scene;
  }
}

export default Scene;
