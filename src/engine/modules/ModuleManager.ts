import { Composer } from '../Composer';
import { Pipe } from '../State';
import {
  startDOMBatching,
  stopDOMBatching,
  flushDOMOperations,
} from '../DOMBatcher';
import { Events } from '../pipes/Events';
import { Perf } from '../pipes/Perf';
import { Errors } from '../pipes/Errors';
import { sdk } from '../sdk';
import { type Module, type ModuleId, type ModuleRegistry } from './Module';
import { typedPath } from '../Lens';

const MODULE_NAMESPACE = 'core.modules';

const eventType = Events.getKeys(MODULE_NAMESPACE, 'load', 'unload');

type ModuleManagerState = {
  registry: ModuleRegistry;
  order: ModuleId[];
  toLoad: ModuleId[];
  toUnload: ModuleId[];
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
  set(mm, { registry: {}, order: [], toLoad: [], toUnload: [] });
});

const reconcilePipe: Pipe = Composer.pipe(
  Events.handle<Module>(eventType.load, event =>
    Composer.do(({ get, over }) => {
      const { registry } = get(mm);
      const id = event.payload.id;
      if (registry[id]) return;

      over(mm.registry, reg => ({
        ...reg,
        [id]: event.payload,
      }));
      over(mm.toLoad, ids => [...ids, id], []);
    })
  ),
  Events.handle<ModuleId>(eventType.unload, event =>
    Composer.do(({ get, over }) => {
      const { registry } = get(mm);
      if (!registry[event.payload]) return;

      over(mm.toUnload, ids => [...ids, event.payload], []);
    })
  )
);

const transitionPipe: Pipe = Composer.do(({ get, pipe, set }) => {
  const { toUnload, toLoad, registry, order } = get(mm);

  if (toLoad.length === 0 && toUnload.length === 0) return;

  for (const id of toUnload) {
    const mod = registry[id];
    if (mod?.name) delete (sdk as any)[mod.name];
  }

  for (const id of toLoad) {
    const mod = registry[id];
    if (mod?.name) (sdk as any)[mod.name] = mod;
  }

  const unloadOrder = toUnload.filter(id => order.includes(id));

  const deactivates = unloadOrder
    .map(id => wrapPhase(id, 'deactivate', registry[id]?.deactivate))
    .filter((p): p is Pipe => Boolean(p));

  const newOrder = topologicalSort(
    [...order.filter(id => !toUnload.includes(id)), ...toLoad],
    registry
  );

  const loadOrder = toLoad.filter(id => newOrder.includes(id));

  const activates = loadOrder
    .map(id => wrapPhase(id, 'activate', registry[id]?.activate))
    .filter((p): p is Pipe => Boolean(p));

  set(mm.order, newOrder);

  const pipes = [...deactivates, ...activates];
  if (pipes.length === 0) return;

  startDOMBatching();
  pipe(...pipes);
  stopDOMBatching();
  flushDOMOperations();
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

  startDOMBatching();
  pipe(...pipes);
  stopDOMBatching();
  flushDOMOperations();
});

const finalizePipe: Pipe = Composer.do(({ get, set }) => {
  const { toUnload, toLoad, registry } = get(mm);

  if (toLoad.length === 0 && toUnload.length === 0) return;

  const newRegistry = { ...registry };
  for (const id of toUnload) delete newRegistry[id];

  set(mm.registry, newRegistry);
  set(mm.toLoad, []);
  set(mm.toUnload, []);
});

declare module '../sdk' {
  interface SDK {
    ModuleManager: typeof ModuleManager;
  }
}

sdk.ModuleManager = ModuleManager;

export const moduleManagerPipe: Pipe = Composer.pipe(
  initPipe,
  reconcilePipe,
  transitionPipe,
  updatePipe,
  finalizePipe
);
