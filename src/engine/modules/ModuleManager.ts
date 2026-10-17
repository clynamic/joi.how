import { Composer } from '../Composer';
import { Pipe } from '../State';
import { Events } from '../pipes/Events';
import { Perf } from '../pipes/Perf';
import { Errors } from '../pipes/Errors';
import { Effects } from '../pipes/Effects';
import { Log } from '../pipes/Log';
import { sdk } from '../sdk';
import { type Module, type ModuleId, type ModuleRegistry } from './Module';
import { typedPath } from '../Lens';

const MODULE_NAMESPACE = 'core.modules';

const eventType = Events.getKeys(MODULE_NAMESPACE, 'load', 'unload', 'reload');

type ModuleManagerState = {
  registry: ModuleRegistry;
  order: ModuleId[];
  toLoad: ModuleId[];
  toUnload: ModuleId[];
  retired: Module[];
  replacing: Record<ModuleId, Module>;
};

const mm = typedPath<ModuleManagerState>([MODULE_NAMESPACE]);

export class ModuleManager {
  static readonly eventType = eventType;

  static load(module: Module): Pipe {
    return Events.dispatch({
      type: eventType.load,
      payload: module,
    });
  }

  static unload(id: ModuleId): Pipe {
    return Events.dispatch({
      type: eventType.unload,
      payload: id,
    });
  }

  static reload(id: ModuleId): Pipe {
    return Events.dispatch({
      type: eventType.reload,
      payload: id,
    });
  }
}

function wrapPhase(id: ModuleId, phase: string, p?: Pipe): Pipe | undefined {
  return p
    ? Perf.withTiming(id, phase, Errors.withCatch(id, phase, p))
    : undefined;
}

function topologicalSort(
  ids: ModuleId[],
  registry: ModuleRegistry
): ModuleId[] {
  const graph = new Map<ModuleId, Set<ModuleId>>();

  for (const id of ids) {
    graph.set(id, new Set());
  }

  for (const id of ids) {
    const mod = registry[id];
    if (!mod?.ordering) continue;

    const { loadAfter, loadBefore } = mod.ordering;

    if (loadAfter) {
      for (const dep of loadAfter) {
        if (ids.includes(dep)) {
          graph.get(id)!.add(dep);
        }
      }
    }

    if (loadBefore) {
      for (const target of loadBefore) {
        if (ids.includes(target)) {
          graph.get(target)!.add(id);
        }
      }
    }
  }

  const result: ModuleId[] = [];
  const visited = new Set<ModuleId>();
  const visiting = new Set<ModuleId>();

  function visit(id: ModuleId): void {
    if (visited.has(id)) return;
    if (visiting.has(id)) return;

    visiting.add(id);

    for (const dep of graph.get(id) ?? []) {
      visit(dep);
    }

    visiting.delete(id);
    visited.add(id);
    result.push(id);
  }

  for (const id of ids) {
    visit(id);
  }

  return result;
}

const initPipe: Pipe = Composer.do(({ get, set }) => {
  if (get(mm)) return;
  set(mm, {
    registry: {},
    order: [],
    toLoad: [],
    toUnload: [],
    retired: [],
    replacing: {},
  });
});

const retirePipe: Pipe = Composer.set(mm.retired, []);

const add = (ids: ModuleId[] = [], id: ModuleId) =>
  ids.includes(id) ? ids : [...ids, id];

const reconcilePipe: Pipe = Events.handle(
  Events.getKey(MODULE_NAMESPACE, '*'),
  event =>
    Composer.do(({ get, over }) => {
      const { registry, toUnload, order } = get(mm);
      switch (event.type) {
        case eventType.load: {
          const module = event.payload as Module;
          const id = module.id;
          const existing = registry[id];
          if (existing === module) {
            if (toUnload.includes(id)) over(mm.toLoad, ids => add(ids, id));
            return;
          }
          if (existing) {
            over(mm.replacing, map => ({ [id]: existing, ...map }), {});
            over(mm.toUnload, ids => add(ids, id));
          }
          over(mm.registry, reg => ({ ...reg, [id]: module }));
          over(mm.toLoad, ids => add(ids, id));
          return;
        }
        case eventType.unload: {
          const id = event.payload as ModuleId;
          if (!registry[id]) return;
          over(mm.toLoad, ids => ids.filter(i => i !== id), []);
          if (order.includes(id)) {
            over(mm.toUnload, ids => add(ids, id));
          } else if (!toUnload.includes(id)) {
            over(mm.registry, reg =>
              Object.fromEntries(
                Object.entries(reg).filter(([key]) => key !== id)
              )
            );
          }
          return;
        }
        case eventType.reload: {
          const id = event.payload as ModuleId;
          if (!registry[id]) return;
          over(mm.toUnload, ids => add(ids, id));
          over(mm.toLoad, ids => add(ids, id));
          return;
        }
        default:
          return;
      }
    })
);

const transitionPipe: Pipe = Composer.do(({ get, pipe, set }) => {
  const { toUnload, toLoad, registry, order, replacing = {} } = get(mm);

  if (toLoad.length === 0 && toUnload.length === 0) return;

  const unloadOrder = toUnload.filter(id => order.includes(id));
  const outgoing = (id: ModuleId): Module | undefined =>
    replacing[id] ?? registry[id];

  const deactivates = unloadOrder
    .map(id => wrapPhase(id, 'deactivate', outgoing(id)?.deactivate))
    .filter((p): p is Pipe => Boolean(p));

  const newOrder = topologicalSort(
    [...order.filter(id => !toUnload.includes(id)), ...toLoad],
    registry
  );

  const loadOrder = toLoad.filter(id => newOrder.includes(id));

  for (const id of loadOrder) {
    const mod = registry[id];
    if (!mod?.sdk) continue;
    const taken = Object.hasOwn(sdk, mod.sdk)
      ? (sdk as any)[mod.sdk]
      : undefined;
    if (taken === undefined || taken?.id === mod.id) {
      (sdk as any)[mod.sdk] = mod;
    } else {
      pipe(
        Log.error(id, 'sdk name {name} is taken by {owner}', {
          name: mod.sdk,
          owner: taken?.id ?? 'the engine',
        })
      );
    }
  }

  const owners = new Map<string, ModuleId>(
    Effects.engineTypes().map(type => [type, 'the engine'])
  );
  for (const id of newOrder) {
    for (const performer of registry[id]?.effects ?? []) {
      const owner = owners.get(performer.type);
      if (owner === undefined) {
        owners.set(performer.type, id);
      } else if (owner !== id && loadOrder.includes(id)) {
        pipe(
          Log.error(id, 'effect {type} is already performed by {owner}', {
            type: performer.type,
            owner,
          })
        );
      }
    }
  }

  const activates = loadOrder
    .map(id => wrapPhase(id, 'activate', registry[id]?.activate))
    .filter((p): p is Pipe => Boolean(p));

  set(mm.order, newOrder);
  set(
    mm.retired,
    unloadOrder.map(id => outgoing(id)!)
  );

  const pipes = [...deactivates, ...activates];
  if (pipes.length === 0) return;

  pipe(...pipes);
});

const updatePipe: Pipe = Composer.do(({ get, pipe }) => {
  const { order, registry } = get(mm);

  if (order.length === 0) return;

  const beforeUpdates = order
    .map(id => wrapPhase(id, 'beforeUpdate', registry[id]?.beforeUpdate))
    .filter((p): p is Pipe => Boolean(p));

  const updates = order
    .map(id => wrapPhase(id, 'update', registry[id]?.update))
    .filter((p): p is Pipe => Boolean(p));

  const afterUpdates = order
    .map(id => wrapPhase(id, 'afterUpdate', registry[id]?.afterUpdate))
    .filter((p): p is Pipe => Boolean(p));

  const pipes = [...beforeUpdates, ...updates, ...afterUpdates];
  if (pipes.length === 0) return;

  pipe(...pipes);
});

const finalizePipe: Pipe = Composer.do(({ get, set }) => {
  const { toUnload, toLoad, registry } = get(mm);

  if (toLoad.length === 0 && toUnload.length === 0) return;

  const newRegistry = { ...registry };
  for (const id of toUnload) {
    if (!toLoad.includes(id)) delete newRegistry[id];
  }

  set(mm.registry, newRegistry);
  set(mm.toLoad, []);
  set(mm.toUnload, []);
  set(mm.replacing, {});
});

declare module '../sdk' {
  interface SDK {
    ModuleManager: typeof ModuleManager;
  }
}

sdk.ModuleManager = ModuleManager;

export const moduleManagerPipe: Pipe = Composer.pipe(
  initPipe,
  retirePipe,
  reconcilePipe,
  transitionPipe,
  updatePipe,
  finalizePipe
);
