import { Composer } from './Composer';
import { Effects } from './pipes/Effects';
import { Events } from './pipes/Events';
import { Scheduler } from './pipes/Scheduler';
import { definePlugin, pluginPaths } from './plugins/Plugins';
import { registry } from './registry';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PluginSDK {}

export interface SDK extends PluginSDK {
  debug: boolean;
  Composer: typeof Composer;
  Effects: typeof Effects;
  Events: typeof Events;
  Scheduler: typeof Scheduler;
  pluginPaths: typeof pluginPaths;
  definePlugin: typeof definePlugin;
}

export const sdk: SDK = Object.assign(registry, {
  debug: false,
  Composer,
  Effects,
  Events,
  Scheduler,
  pluginPaths,
  definePlugin,
}) as unknown as SDK;

(globalThis as any).sdk = sdk;
