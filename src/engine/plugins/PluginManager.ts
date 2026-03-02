import { Composer } from '../Composer';
import { Pipe, PipeTransformer } from '../State';
import { Storage } from '../pipes/Storage';
import { Events } from '../pipes/Events';
import { ModuleManager } from '../modules/ModuleManager';
import {
  pluginPaths,
  type PluginId,
  type PluginClass,
  type PluginRegistry,
  type EnabledMap,
} from './Plugins';
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
  registry: PluginRegistry;
  loadedIds: Set<PluginId>;
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
    Composer.do(({ over, get, pipe }) => {
      const loadedIds = get(pm.loadedIds) ?? new Set();
      if (loadedIds.has(event.payload)) {
        pipe(ModuleManager.unload(event.payload));
        over(pm.loadedIds, ids => {
          const next = new Set(ids);
          next.delete(event.payload);
          return next;
        });
      }
      over(pm.registry, registry => {
        const next = { ...registry };
        delete next[event.payload];
        return next;
      });
    })
  ),
  Storage.bind<EnabledMap>(storageKey.enabled, (stored = {}) =>
    Composer.do(({ get, set, pipe }) => {
      const registry = get(pm.registry) ?? {};
      const loadedIds = get(pm.loadedIds) ?? new Set();

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

      const toUnload = [...loadedIds].filter(id => !shouldBeLoaded.has(id));
      const toLoad = [...shouldBeLoaded].filter(id => !loadedIds.has(id));

      if (!dirty && toLoad.length === 0 && toUnload.length === 0) return;

      if (dirty) pipe(Storage.set<EnabledMap>(storageKey.enabled, map));

      for (const id of toUnload) {
        pipe(ModuleManager.unload(id));
      }

      for (const id of toLoad) {
        const cls = registry[id];
        if (cls?.plugin) {
          pipe(ModuleManager.load({ ...cls.plugin, name: cls.name }));
        }
      }

      const newLoadedIds = new Set(
        [...loadedIds].filter(id => !toUnload.includes(id))
      );
      for (const id of toLoad) newLoadedIds.add(id);
      set(pm.loadedIds, newLoadedIds);
    })
  )
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
  reconcilePipe
);
