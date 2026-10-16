import { Composer } from '../Composer';
import { typedPath } from '../Lens';
import type { Module, ModuleId } from '../modules/Module';
import { pluginPaths } from '../plugins/Plugins';
import { GameFrame, Pipe } from '../State';
import { Log, LOG_LINE, type LogEntry } from './Log';

export type EffectKey<T> = string & { readonly __payload?: T };

export type Effect<T = unknown> = { type: EffectKey<T>; payload: T };

export type Inject = (pipe: Pipe) => void;

export type Observe = (owner: string, type: string, duration: number) => void;

export type Performer<T> = {
  type: EffectKey<T>;
  perform(payload: T, inject: Inject): void;
};

export type EffectDefinition<T> = {
  type: EffectKey<T>;
  emit(payload: T): Pipe;
  perform(fn: (payload: T, inject: Inject) => void): Performer<T>;
};

export type EffectState = {
  queue: Effect[];
};

type ModuleState = {
  registry: Record<ModuleId, Module>;
  order: ModuleId[];
  retired: Module[];
};

type Owned = { performer: Performer<unknown>; owner: string };

type Cached = {
  registry: Record<ModuleId, Module>;
  order: ModuleId[];
  found: Map<string, Owned>;
};

let cached: Cached | null = null;

const PLUGIN_NAMESPACE = 'core.effects';

const effects = pluginPaths<EffectState>(PLUGIN_NAMESPACE);
const modules = typedPath<ModuleState>(['core.modules']);

const engine: Owned[] = [
  {
    owner: 'core.log',
    performer: {
      type: LOG_LINE as EffectKey<unknown>,
      perform: payload => Log.perform(payload as LogEntry),
    },
  },
];

export class Effects {
  static engineTypes(): string[] {
    return engine.map(({ performer }) => performer.type);
  }

  static define<T = void>(namespace: string, key: string): EffectDefinition<T> {
    const type = `${namespace}/${key}` as EffectKey<T>;
    return {
      type,
      emit: payload =>
        Composer.over(
          effects.queue,
          queue => [...queue, { type, payload }],
          []
        ),
      perform: fn => ({ type, perform: fn }),
    };
  }

  static pipe: Pipe = Composer.set(effects.queue, []);

  static performers(frame: GameFrame): Map<string, Owned> {
    const {
      registry = {},
      order = [],
      retired = [],
    } = Composer.get(modules)(frame) ?? {};
    if (
      cached &&
      cached.registry === registry &&
      cached.order === order &&
      retired.length === 0
    ) {
      return cached.found;
    }
    const found = new Map<string, Owned>();
    for (const { performer, owner } of engine) {
      found.set(performer.type, { performer, owner });
    }
    for (const id of order) {
      for (const performer of registry[id]?.effects ?? []) {
        if (!found.has(performer.type))
          found.set(performer.type, { performer, owner: id });
      }
    }
    for (const module of retired) {
      for (const performer of module.effects ?? []) {
        if (!found.has(performer.type))
          found.set(performer.type, { performer, owner: module.id });
      }
    }
    cached = retired.length === 0 ? { registry, order, found } : null;
    return found;
  }

  static flush(frame: GameFrame, inject: Inject, observe?: Observe): void {
    const queue = Composer.get(effects.queue)(frame) ?? [];
    if (queue.length === 0) return;

    const performers = Effects.performers(frame);
    for (const effect of queue) {
      const owned = performers.get(effect.type);
      if (!owned) {
        inject(
          Log.warn(PLUGIN_NAMESPACE, 'nothing performs {type}', {
            type: effect.type,
          })
        );
        continue;
      }
      try {
        const before = observe ? performance.now() : 0;
        owned.performer.perform(effect.payload, inject);
        if (observe)
          observe(owned.owner, effect.type, performance.now() - before);
      } catch (error) {
        inject(
          Log.error(owned.owner, 'effect {type} failed: {error}', {
            type: effect.type,
            error: String(error),
          })
        );
      }
    }
  }
}
