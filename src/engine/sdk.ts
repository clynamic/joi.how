import { Composer } from './Composer';
import { Effects } from './pipes/Effects';
import { Events } from './pipes/Events';
import { Scheduler } from './pipes/Scheduler';
import { pluginPaths } from './plugins/Plugins';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PluginSDK {}

export interface SDK extends PluginSDK {
  debug: boolean;
  Composer: typeof Composer;
  Effects: typeof Effects;
  Events: typeof Events;
  Scheduler: typeof Scheduler;
  pluginPaths: typeof pluginPaths;
}

export const sdk: SDK = {
  debug: false,
  Composer,
  Effects,
  Events,
  Scheduler,
  pluginPaths,
} as SDK;

(globalThis as any).sdk = sdk;
