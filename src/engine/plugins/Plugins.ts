import { typedPath, TypedPath } from '../Lens';
import type { Module } from '../modules/Module';

// TODO: make typedPath accept string and kill this thing.
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

export type PluginConstraints = {
  dependsOn?: PluginId[];
  conflictsWith?: PluginId[];
};

export type Plugin = Module & {
  meta?: PluginMeta;
  constraints?: PluginConstraints;
};

export type PluginRegistry = Record<PluginId, Plugin>;
export type EnabledMap = Record<PluginId, boolean>;

export function definePlugin<T extends Plugin & { [key: string]: unknown }>(
  plugin: T
): T {
  return plugin;
}
