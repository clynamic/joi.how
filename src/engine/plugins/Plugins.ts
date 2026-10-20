import { typedPath, TypedPath } from '../Lens';
import type { Module } from '../modules/Module';
import { registry } from '../registry';

// TODO: make typedPath accept string and kill this thing.
export function pluginPaths<T>(namespace: string): TypedPath<T> {
  return typedPath<T>(namespace);
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

const defined = new Set<PluginId>();

export const definedIds = (): PluginId[] => [...defined];

export function definePlugin<T extends Plugin & { [key: string]: unknown }>(
  plugin: T
): T {
  defined.add(plugin.id);
  if (plugin.sdk) registry[plugin.sdk] = plugin;
  return plugin;
}
