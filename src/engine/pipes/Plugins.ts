import { Composer } from '../Composer';
import { Pipe, GameFrame } from '../State';
import {
  startDOMBatching,
  stopDOMBatching,
  flushDOMOperations,
} from '../DOMBatcher';
import { Storage } from './Storage';

export const PLUGIN_NAMESPACE = 'how.joi.plugins';

export type PluginId = string;

export type PluginMeta = {
  name?: string;
  description?: string;
  version?: string;
  author?: string;
};

export type Plugin = {
  id: PluginId;
  meta?: PluginMeta;
  activate?: Pipe;
  update?: Pipe;
  deactivate?: Pipe;
};

export type PluginManagerState = {
  active: PluginId[];
  inserting: PluginId[];
  removing: PluginId[];
};

export type PluginRegistry = {
  [id: PluginId]: Plugin;
};

type PluginLoad = {
  promise: Promise<Plugin>;
  result?: Plugin;
  error?: Error;
};

type PluginManagerContext = {
  registry: PluginRegistry;
  pending: Map<PluginId, PluginLoad>;
};

const defaultState = (): PluginManagerState => ({
  active: [],
  inserting: [],
  removing: [],
});

const defaultContext = (): PluginManagerContext => ({
  registry: {},
  pending: new Map(),
});

export const INBUILT_PLUGINS: Plugin[] = [];

async function load(code: string): Promise<Plugin> {
  const blob = new Blob([code], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);

  try {
    const module = await import(/* @vite-ignore */ url);
    const plugin: Plugin = module.default || module.plugin;

    if (!plugin || !plugin.id) {
      throw new Error('Plugin must export a Plugin object with an id');
    }

    return plugin;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function savePlugin(id: PluginId, code: string): Pipe {
  return Storage.set(`how.joi.plugin.code/${id}`, code);
}

export function activatePlugin(id: PluginId): Pipe {
  return Composer.over<PluginManagerState>(
    ['state', PLUGIN_NAMESPACE],
    (state = defaultState()) => {
      if (state.inserting?.includes(id)) return state;
      return {
        ...state,
        inserting: [...(state.inserting || []), id],
      };
    }
  );
}

export function deactivatePlugin(id: PluginId): Pipe {
  return Composer.over<PluginManagerState>(
    ['state', PLUGIN_NAMESPACE],
    (state = defaultState()) => {
      if (state.removing?.includes(id)) return state;
      return {
        ...state,
        removing: [...(state.removing || []), id],
      };
    }
  );
}

function getPlugin(registry: PluginRegistry, id: PluginId): Plugin | undefined {
  return registry[id];
}

// STAGE 1: Register inbuilt plugins + resolve completed async loads
const buildRegistryPipe: Pipe = Composer.over<PluginManagerContext>(
  ['context', PLUGIN_NAMESPACE],
  (ctx = defaultContext()) => {
    const registry = { ...ctx.registry };
    const pending = new Map(ctx.pending);

    for (const plugin of INBUILT_PLUGINS) {
      registry[plugin.id] = plugin;
    }

    for (const [id, entry] of pending) {
      if (entry.result) {
        registry[entry.result.id] = entry.result;
        pending.delete(id);
      } else if (entry.error) {
        pending.delete(id);
      }
    }

    return { registry, pending };
  }
);

// STAGE 2: Load user plugins from Storage, start async imports for new ones
const loadUserPluginsPipe: Pipe = Storage.bind<PluginId[]>(
  'how.joi.plugins.user',
  userPluginIds =>
    Composer.pipe(
      ...(userPluginIds || []).map(id =>
        Storage.bind<string>(`how.joi.plugin.code/${id}`, code =>
          Composer.bind<PluginManagerContext>(
            ['context', PLUGIN_NAMESPACE],
            (ctx = defaultContext()) => {
              if (ctx.registry[id] || ctx.pending.has(id) || !code) {
                return (frame: GameFrame) => frame;
              }

              const pluginLoad: PluginLoad = {
                promise: load(code),
              };

              pluginLoad.promise.then(
                plugin => {
                  pluginLoad.result = plugin;
                },
                error => {
                  pluginLoad.error = error;
                }
              );

              const pending = new Map(ctx.pending);
              pending.set(id, pluginLoad);

              return Composer.set<PluginManagerContext>(
                ['context', PLUGIN_NAMESPACE],
                { registry: ctx.registry, pending }
              );
            }
          )
        )
      )
    )
);

// STAGE 3: Execute plugin lifecycle with DOM batching
const lifecyclePipe: Pipe = Composer.bind<PluginManagerState>(
  ['state', PLUGIN_NAMESPACE],
  (state = defaultState()) => {
    const { inserting = [], active = [], removing = [] } = state;

    return Composer.bind<PluginManagerContext>(
      ['context', PLUGIN_NAMESPACE],
      (ctx = defaultContext()) => {
        const pipes: Pipe[] = [];

        pipes.push((frame: GameFrame) => {
          startDOMBatching();
          return frame;
        });

        for (const id of inserting) {
          const plugin = getPlugin(ctx.registry, id);
          if (plugin?.activate) pipes.push(plugin.activate);
        }

        for (const id of active) {
          if (!removing.includes(id)) {
            const plugin = getPlugin(ctx.registry, id);
            if (plugin?.update) pipes.push(plugin.update);
          }
        }

        for (const id of inserting) {
          const plugin = getPlugin(ctx.registry, id);
          if (plugin?.update) pipes.push(plugin.update);
        }

        for (const id of removing) {
          const plugin = getPlugin(ctx.registry, id);
          if (plugin?.deactivate) pipes.push(plugin.deactivate);
        }

        pipes.push((frame: GameFrame) => {
          stopDOMBatching();
          flushDOMOperations();
          return frame;
        });

        return Composer.pipe(...pipes);
      }
    );
  }
);

// STAGE 4: Transition state for next frame
const transitionPipe: Pipe = Composer.over<PluginManagerState>(
  ['state', PLUGIN_NAMESPACE],
  (state = defaultState()) => {
    const { active = [], inserting = [], removing = [] } = state;

    return {
      active: [
        ...active.filter(id => !removing.includes(id)),
        ...inserting.filter(id => !active.includes(id)),
      ],
      inserting: [],
      removing: [],
    };
  }
);

export const pluginManagerPipe: Pipe = Composer.pipe(
  buildRegistryPipe,
  loadUserPluginsPipe,
  lifecyclePipe,
  transitionPipe
);
