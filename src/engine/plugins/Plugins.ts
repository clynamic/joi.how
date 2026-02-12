import { typedPath, TypedPath } from '../Lens';
import { Pipe } from '../State';

export function pluginPaths<TState, TContext = Record<string, never>>(
  namespace: string
): { state: TypedPath<TState>; context: TypedPath<TContext> } {
  return {
    state: typedPath<TState>(['state', namespace]),
    context: typedPath<TContext>(['context', namespace]),
  };
}

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

export type PluginRegistry = Record<PluginId, Plugin>;
export type EnabledMap = Record<PluginId, boolean>;
