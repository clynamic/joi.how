import { Composer } from './Composer';
import { Effects } from './pipes/Effects';
import { Events } from './pipes/Events';
import { Scheduler } from './pipes/Scheduler';
import { definePlugin, pluginPaths } from './plugins/Plugins';
import { registry } from './registry';
import { Pipe } from './State';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PluginSDK {}

export type PluginIndexEntry = {
  sdk: string;
  id: string;
  name?: string;
  description?: string;
  hooks: string[];
  commands: string[];
  values: string[];
};

export type SdkIndex = {
  engine: string[];
  plugins: PluginIndexEntry[];
};

export interface SDK extends PluginSDK {
  debug: boolean;
  Composer: typeof Composer;
  Effects: typeof Effects;
  Events: typeof Events;
  Scheduler: typeof Scheduler;
  pluginPaths: typeof pluginPaths;
  definePlugin: typeof definePlugin;
  index: () => SdkIndex;
  inject: (pipe: Pipe) => void;
}

const LIFECYCLE = new Set([
  'activate',
  'beforeUpdate',
  'update',
  'afterUpdate',
  'deactivate',
]);

const SHAPE = new Set([
  'id',
  'sdk',
  'meta',
  'ordering',
  'constraints',
  'effects',
]);

const isHook = (name: string) => /^(on|when)[A-Z]/.test(name);

function index(): SdkIndex {
  const engine: string[] = [];
  const plugins: PluginIndexEntry[] = [];
  for (const [key, value] of Object.entries(sdk)) {
    if (key === 'index') continue;
    const mod = value as Record<string, unknown> | null;
    if (!mod || typeof mod !== 'object' || typeof mod.id !== 'string') {
      engine.push(key);
      continue;
    }
    const own = Object.keys(mod).filter(
      name => !LIFECYCLE.has(name) && !SHAPE.has(name)
    );
    const methods = own.filter(name => typeof mod[name] === 'function');
    const values = own.filter(name => typeof mod[name] !== 'function');
    const meta = (mod.meta ?? {}) as { name?: string; description?: string };
    plugins.push({
      sdk: key,
      id: mod.id,
      ...(meta.name !== undefined && { name: meta.name }),
      ...(meta.description !== undefined && { description: meta.description }),
      hooks: methods.filter(isHook),
      commands: methods.filter(name => !isHook(name)),
      values,
    });
  }
  engine.sort();
  plugins.sort((a, b) => a.sdk.localeCompare(b.sdk));
  return { engine, plugins };
}

export const sdk: SDK = Object.assign(registry, {
  debug: false,
  Composer,
  Effects,
  Events,
  Scheduler,
  pluginPaths,
  definePlugin,
  index,
  inject: () => undefined,
}) as unknown as SDK;

(globalThis as any).sdk = sdk;
