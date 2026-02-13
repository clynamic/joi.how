import { Composer } from './Composer';
import { Events } from './pipes/Events';
import { Messages } from './pipes/Messages';
import { Scheduler } from './pipes/Scheduler';
import { Storage } from './pipes/Storage';
import { PluginManager } from './plugins/PluginManager';
import { pluginPaths } from './plugins/Plugins';
import { Random } from './Random';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PluginSDK {}

export interface SDK extends PluginSDK {
  Composer: typeof Composer;
  Events: typeof Events;
  Messages: typeof Messages;
  Scheduler: typeof Scheduler;
  Storage: typeof Storage;
  PluginManager: typeof PluginManager;
  Random: typeof Random;
  pluginPaths: typeof pluginPaths;
}

export const sdk: SDK = {
  Composer,
  Events,
  Messages,
  Scheduler,
  Storage,
  PluginManager,
  Random,
  pluginPaths,
} as SDK;
