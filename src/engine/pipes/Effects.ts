import { Composer } from '../Composer';
import { typedPath } from '../Lens';
import type { Module, ModuleId } from '../modules/Module';
import { pluginPaths } from '../plugins/Plugins';
import { GameFrame, Pipe } from '../State';

export type EffectKey<T> = string & { readonly __payload?: T };

export type Effect<T = unknown> = { type: EffectKey<T>; payload: T };

export type Inject = (pipe: Pipe) => void;

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
};

const PLUGIN_NAMESPACE = 'core.effects';

const effects = pluginPaths<EffectState>(PLUGIN_NAMESPACE);
const modules = typedPath<ModuleState>(['core.modules']);

export class Effects {
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

  static performers(frame: GameFrame): Map<string, Performer<unknown>> {
    const { registry = {}, order = [] } = Composer.get(modules)(frame) ?? {};
    const found = new Map<string, Performer<unknown>>();
    for (const id of order) {
      for (const performer of registry[id]?.effects ?? []) {
        if (import.meta.env.DEV && found.has(performer.type)) {
          throw new Error(
            `Effect "${performer.type}" is performed by more than one module`
          );
        }
        found.set(performer.type, performer);
      }
    }
    return found;
  }

  static flush(frame: GameFrame, inject: Inject): void {
    const queue = Composer.get(effects.queue)(frame) ?? [];
    if (queue.length === 0) return;

    const performers = Effects.performers(frame);
    for (const effect of queue) {
      const performer = performers.get(effect.type);
      if (!performer) {
        if (import.meta.env.DEV) {
          console.warn(`[effects] nothing performs "${effect.type}"`);
        }
        continue;
      }
      try {
        performer.perform(effect.payload, inject);
      } catch (error) {
        console.error(`[effects] ${effect.type} failed:`, error);
      }
    }
  }
}
