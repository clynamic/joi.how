import { ModuleManager } from '../../engine/modules/ModuleManager';
import { Composer } from '../../engine/Composer';
import { Pipe } from '../../engine/State';
import PluginInstaller from '../../engine/plugins/PluginInstaller';
import Storage from '../../engine/plugins/Storage';
import Scene from './scene';
import Mode from './mode';
import Debug from './debug';
import Fps from './fps';
import Pause from './pause';
import Saves from './saves';
import Classic from './classic';
import Phase from './phase';
import PerfOverlay from './perf';
import Image from './image';
import Rand from './rand';
import Sound from './sound';
import Messages from './messages';
import Toy from './toy';

const plugins = [
  Scene,
  Phase,
  Mode,
  Rand,
  Sound,
  Messages,
  Image,
  Debug,
  Pause,
  Saves,
  Classic,
  Toy,
  Fps,
  PerfOverlay,
];

export const registerPlugins: Pipe = Composer.pipe(
  ModuleManager.load(Storage),
  ModuleManager.load(PluginInstaller),
  ...plugins.map(ModuleManager.load)
);
