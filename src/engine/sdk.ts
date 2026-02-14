import { Composer } from './Composer';
import { Events } from './pipes/Events';
import { Scheduler } from './pipes/Scheduler';
import { Storage } from './pipes/Storage';
import { PluginManager } from './plugins/PluginManager';
import { pluginPaths } from './plugins/Plugins';
import { Random } from './Random';
import { Perf } from './pipes/Perf';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PluginSDK {}

export interface SDK extends PluginSDK {
  debug: boolean;
  Composer: typeof Composer;
  Events: typeof Events;
  Scheduler: typeof Scheduler;
  Storage: typeof Storage;
  PluginManager: typeof PluginManager;
  Perf: typeof Perf;
  Random: typeof Random;
  pluginPaths: typeof pluginPaths;
}

export const sdk: SDK = {
  debug: false,
  Composer,
  Events,
  Scheduler,
  Storage,
  PluginManager,
  Perf,
  Random,
  pluginPaths,
} as SDK;
