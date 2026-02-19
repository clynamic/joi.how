import { Composer } from '../Composer';
import { Pipe, PipeTransformer } from '../State';
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
import { Perf } from '../pipes/Perf';
import { Errors } from '../pipes/Errors';
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

export type PluginManagerAPI = {
  register: PipeTransformer<[PluginClass]>;
  unregister: PipeTransformer<[PluginId]>;
  enable: PipeTransformer<[PluginId]>;
  disable: PipeTransformer<[PluginId]>;
};

type PluginManagerState = PluginManagerAPI & {
  loaded: PluginId[];
  registry: PluginRegistry;
  loadedRefs: Record<PluginId, PluginClass>;
  toLoad: PluginId[];
  toUnload: PluginId[];
};

const pm = pluginPaths<PluginManagerState>(PLUGIN_NAMESPACE);

export class PluginManager {
  static register(pluginClass: PluginClass): Pipe {
    return Composer.bind(pm, ({ register }) => register(pluginClass));
  }

  static unregister(id: PluginId): Pipe {
    return Composer.bind(pm, ({ unregister }) => unregister(id));
  }

  static enable(id: PluginId): Pipe {
    return Composer.bind(pm, ({ enable }) => enable(id));
  }

  static disable(id: PluginId): Pipe {
    return Composer.bind(pm, ({ disable }) => disable(id));
  }
}

const apiPipe: Pipe = Composer.over(pm, ctx => ({
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
  Events.handle<PluginId>(eventType.enable, event =>
    Storage.bind<EnabledMap>(storageKey.enabled, (map = {}) =>
      Storage.set<EnabledMap>(storageKey.enabled, {
        ...map,
        [event.payload]: true,
      })
    )
  ),
  Events.handle<PluginId>(eventType.disable, event =>
    Storage.bind<EnabledMap>(storageKey.enabled, (map = {}) =>
      Storage.set<EnabledMap>(storageKey.enabled, {
        ...map,
        [event.payload]: false,
      })
    )
  )
);

const reconcilePipe: Pipe = Composer.pipe(
  Events.handle<PluginClass>(eventType.register, event =>
    Composer.do(({ over }) => {
      over(pm.registry, registry => ({
        ...registry,
        [event.payload.plugin.id]: event.payload,
      }));
    })
  ),
  Events.handle<PluginId>(eventType.unregister, event =>
    Composer.do(({ over }) => {
      over(pm.toUnload, (ids = []) =>
        Array.isArray(ids) ? [...ids, event.payload] : [event.payload]
      );
    })
  ),
  Storage.bind<EnabledMap>(storageKey.enabled, (stored = {}) =>
    Composer.do(({ get, set, pipe }) => {
      const registry = get(pm.registry) ?? {};
      const loaded = get(pm.loaded) ?? [];
      const forcedUnload = get(pm.toUnload) ?? [];

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
      if (toLoad.length > 0) set(pm.toLoad, toLoad);
      if (toUnload.length > 0) set(pm.toUnload, toUnload);
    })
  )
);

const lifecyclePipe: Pipe = Composer.do(({ get, pipe }) => {
  const toUnload = get(pm.toUnload) ?? [];
  const toLoad = get(pm.toLoad) ?? [];
  const loadedRefs = get(pm.loadedRefs) ?? {};
  const registry = get(pm.registry) ?? {};

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
      return p
        ? Perf.withTiming(
            id,
            'deactivate',
            Errors.withCatch(id, 'deactivate', p)
          )
        : undefined;
    })
    .filter(Boolean) as Pipe[];

  const activates = toLoad
    .map(id => {
      const p = registry[id]?.plugin.activate;
      return p
        ? Perf.withTiming(id, 'activate', Errors.withCatch(id, 'activate', p))
        : undefined;
    })
    .filter(Boolean) as Pipe[];

  const activeIds = [
    ...Object.keys(loadedRefs).filter(id => !toUnload.includes(id)),
    ...toLoad,
  ];

  const updates = activeIds
    .map(id => {
      const p = (loadedRefs[id] ?? registry[id])?.plugin.update;
      return p
        ? Perf.withTiming(id, 'update', Errors.withCatch(id, 'update', p))
        : undefined;
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
  Events.handle<PluginId>(eventType.unregister, event =>
    Composer.do(({ over }) => {
      over(pm.registry, registry => {
        const next = { ...registry };
        delete next[event.payload];
        return next;
      });
    })
  ),
  Composer.do(({ get, set, over }) => {
    const toUnload = get(pm.toUnload) ?? [];
    const toLoad = get(pm.toLoad) ?? [];

    if (toLoad.length === 0 && toUnload.length === 0) return;

    const loadedRefs = get(pm.loadedRefs) ?? {};
    const registry = get(pm.registry) ?? {};

    const newRefs = { ...loadedRefs };
    for (const id of toUnload) delete newRefs[id];
    for (const id of toLoad) {
      if (registry[id]) newRefs[id] = registry[id];
    }

    set(pm.loaded, Object.keys(newRefs));
    over(pm, ctx => ({
      ...ctx,
      loadedRefs: newRefs,
      toLoad: [],
      toUnload: [],
    }));
  })
);

declare module '../sdk' {
  interface SDK {
    PluginManager: typeof PluginManager;
  }
}

sdk.PluginManager = PluginManager;

export const pluginManagerPipe: Pipe = Composer.pipe(
  apiPipe,
  enableDisablePipe,
  reconcilePipe,
  lifecyclePipe,
  finalizePipe
);
