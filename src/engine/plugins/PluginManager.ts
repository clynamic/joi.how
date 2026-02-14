import { Composer } from '../Composer';
import { Pipe, PipeTransformer, GameFrame } from '../State';
import {
  startDOMBatching,
  stopDOMBatching,
  flushDOMOperations,
} from '../DOMBatcher';
import { Storage } from '../pipes/Storage';
import { Events } from '../pipes/Events';
import {
  pluginPaths,
  type PluginId,
  type PluginClass,
  type PluginRegistry,
  type EnabledMap,
} from './Plugins';
import { withTiming } from '../pipes/Perf';
import { sdk } from '../sdk';

const PLUGIN_NAMESPACE = 'core.plugin_manager';

const eventType = Events.getKeys(
  PLUGIN_NAMESPACE,
  'register',
  'unregister',
  'enable',
  'disable'
);

const storageKey = {
  enabled: `${PLUGIN_NAMESPACE}.enabled`,
};

type PluginManagerState = {
  loaded: PluginId[];
};

export type PluginManagerAPI = {
  register: PipeTransformer<[PluginClass]>;
  unregister: PipeTransformer<[PluginId]>;
  enable: PipeTransformer<[PluginId]>;
  disable: PipeTransformer<[PluginId]>;
};

type PluginManagerContext = PluginManagerAPI & {
  registry: PluginRegistry;
  loadedRefs: Record<PluginId, PluginClass>;
  toLoad: PluginId[];
  toUnload: PluginId[];
};

const pm = pluginPaths<PluginManagerState, PluginManagerContext>(
  PLUGIN_NAMESPACE
);

export class PluginManager {
  static register(pluginClass: PluginClass): Pipe {
    return Composer.bind<PluginManagerAPI>(pm.context, ({ register }) =>
      register(pluginClass)
    );
  }

  static unregister(id: PluginId): Pipe {
    return Composer.bind<PluginManagerAPI>(pm.context, ({ unregister }) =>
      unregister(id)
    );
  }

  static enable(id: PluginId): Pipe {
    return Composer.bind<PluginManagerAPI>(pm.context, ({ enable }) =>
      enable(id)
    );
  }

  static disable(id: PluginId): Pipe {
    return Composer.bind<PluginManagerAPI>(pm.context, ({ disable }) =>
      disable(id)
    );
  }
}

const apiPipe: Pipe = Composer.over<PluginManagerContext>(pm.context, ctx => ({
  ...ctx,

  register: plugin =>
    Events.dispatch({
      type: eventType.register,
      payload: plugin,
    }),

  unregister: id =>
    Events.dispatch({
      type: eventType.unregister,
      payload: id,
    }),

  enable: id =>
    Events.dispatch({
      type: eventType.enable,
      payload: id,
    }),

  disable: id =>
    Events.dispatch({
      type: eventType.disable,
      payload: id,
    }),
}));

// TODO: enable/disable plugin storage should probably live elsewhere.
const enableDisablePipe: Pipe = Composer.pipe(
  Events.handle(eventType.enable, event =>
    Storage.bind<EnabledMap>(storageKey.enabled, (map = {}) =>
      Storage.set<EnabledMap>(storageKey.enabled, {
        ...map,
        [event.payload as PluginId]: true,
      })
    )
  ),
  Events.handle(eventType.disable, event =>
    Storage.bind<EnabledMap>(storageKey.enabled, (map = {}) =>
      Storage.set<EnabledMap>(storageKey.enabled, {
        ...map,
        [event.payload as PluginId]: false,
      })
    )
  )
);

const reconcilePipe: Pipe = Composer.pipe(
  Events.handle(eventType.register, event =>
    Composer.do<GameFrame>(({ over }) => {
      const cls = event.payload as PluginClass;
      over(pm.context.registry, registry => ({
        ...registry,
        [cls.plugin.id]: cls,
      }));
    })
  ),
  Events.handle(eventType.unregister, event =>
    Composer.do<GameFrame>(({ over }) => {
      const id = event.payload as PluginId;
      over(pm.context.toUnload, (ids = []) =>
        Array.isArray(ids) ? [...ids, id] : [id]
      );
    })
  ),
  Storage.bind<EnabledMap>(storageKey.enabled, (stored = {}) =>
    Composer.do<GameFrame>(({ get, set, pipe }) => {
      const registry = get(pm.context.registry) ?? {};
      const loaded = get(pm.state.loaded) ?? [];
      const forcedUnload = get(pm.context.toUnload) ?? [];

      const map = { ...stored };
      let dirty = false;

      for (const id of Object.keys(registry)) {
        if (!(id in map)) {
          map[id] = true;
          dirty = true;
        }
      }

      const shouldBeLoaded = new Set(
        Object.keys(map).filter(id => map[id] && registry[id])
      );

      for (const id of forcedUnload) shouldBeLoaded.delete(id);

      const currentlyLoaded = new Set(loaded);

      const toUnload = [...currentlyLoaded].filter(
        id => !shouldBeLoaded.has(id)
      );

      const toLoad = [...shouldBeLoaded].filter(id => !currentlyLoaded.has(id));

      if (!dirty && toLoad.length === 0 && toUnload.length === 0) return;

      if (dirty) pipe(Storage.set<EnabledMap>(storageKey.enabled, map));
      if (toLoad.length > 0) set(pm.context.toLoad, toLoad);
      if (toUnload.length > 0) set(pm.context.toUnload, toUnload);
    })
  )
);

// TODO: lifecycle should include error handling
// TODO: OTEL spans for performance monitoring
const lifecyclePipe: Pipe = Composer.do<GameFrame>(({ get, pipe }) => {
  const toUnload = get(pm.context.toUnload) ?? [];
  const toLoad = get(pm.context.toLoad) ?? [];
  const loadedRefs = get(pm.context.loadedRefs) ?? {};
  const registry = get(pm.context.registry) ?? {};

  for (const id of toUnload) {
    const cls = loadedRefs[id] ?? registry[id];
    if (cls) delete (sdk as any)[cls.name];
  }

  for (const id of toLoad) {
    const cls = registry[id];
    if (cls) (sdk as any)[cls.name] = cls;
  }

  const deactivates = toUnload
    .map(id => {
      const p = (loadedRefs[id] ?? registry[id])?.plugin.deactivate;
      return p ? withTiming(id, 'deactivate', p) : undefined;
    })
    .filter(Boolean) as Pipe[];

  const activates = toLoad
    .map(id => {
      const p = registry[id]?.plugin.activate;
      return p ? withTiming(id, 'activate', p) : undefined;
    })
    .filter(Boolean) as Pipe[];

  const activeIds = [
    ...Object.keys(loadedRefs).filter(id => !toUnload.includes(id)),
    ...toLoad,
  ];

  const updates = activeIds
    .map(id => {
      const p = (loadedRefs[id] ?? registry[id])?.plugin.update;
      return p ? withTiming(id, 'update', p) : undefined;
    })
    .filter(Boolean) as Pipe[];

  const pipes = [...deactivates, ...activates, ...updates];
  if (pipes.length === 0) return;

  startDOMBatching();
  pipe(...pipes);
  stopDOMBatching();
  flushDOMOperations();
});

const finalizePipe: Pipe = Composer.pipe(
  Events.handle(eventType.unregister, event =>
    Composer.do<GameFrame>(({ over }) => {
      const id = event.payload as PluginId;
      over(pm.context.registry, registry => {
        const next = { ...registry };
        delete next[id];
        return next;
      });
    })
  ),
  Composer.do<GameFrame>(({ get, set, over }) => {
    const toUnload = get(pm.context.toUnload) ?? [];
    const toLoad = get(pm.context.toLoad) ?? [];

    if (toLoad.length === 0 && toUnload.length === 0) return;

    const loadedRefs = get(pm.context.loadedRefs) ?? {};
    const registry = get(pm.context.registry) ?? {};

    const newRefs = { ...loadedRefs };
    for (const id of toUnload) delete newRefs[id];
    for (const id of toLoad) {
      if (registry[id]) newRefs[id] = registry[id];
    }

    set(pm.state.loaded, Object.keys(newRefs));
    over(pm.context, ctx => ({
      ...ctx,
      loadedRefs: newRefs,
      toLoad: [],
      toUnload: [],
    }));
  })
);

export const pluginManagerPipe: Pipe = Composer.pipe(
  apiPipe,
  enableDisablePipe,
  reconcilePipe,
  lifecyclePipe,
  finalizePipe
);
