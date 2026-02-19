import { typedPath, TypedPath } from '../Lens';
import { Pipe } from '../State';

export function pluginPaths<T>(namespace: string): TypedPath<T> {
  return typedPath<T>([namespace]);
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

export type PluginClass = {
  plugin: Plugin;
  name: string;
};

export type PluginRegistry = Record<PluginId, PluginClass>;
export type EnabledMap = Record<PluginId, boolean>;
