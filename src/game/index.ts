import { ModuleManager } from '../engine/modules/ModuleManager';
import { Composer } from '../engine/Composer';
import { Pipe } from '../engine/State';
import PluginInstaller from '../engine/plugins/PluginInstaller';
import Storage from '../engine/plugins/Storage';
import Bytes from './bytes';
import Scene from './scene';
import Mode from './mode';
import Keys from './keys';
import Debug from './debug/overlay';
import Fps from './debug/fps';
import Pause from './pause';
import Saves from './saves';
import Classic from './classic';
import Phase from './phase';
import PerfOverlay from './debug/perf';
import Image from './classic/image';
import Rand from './rand';
import Sound from './sound';
import Messages from './messages';
import Toy from './toy';
import Settings from './settings';
import Presets from './presets';
import Home from './home';
import Player from './player';
import './player/settings';
import Assets from './assets';
import Local from './local';
import E621 from './e621';
import ClassicImages from './classic/images';
import { Effects } from '../engine/pipes/Effects';
import { Events } from '../engine/pipes/Events';
import { Requests } from '../engine/pipes/Requests';
import { Scheduler } from '../engine/pipes/Scheduler';
import { Perf } from '../engine/pipes/Perf';
import { Errors } from '../engine/pipes/Errors';
import { Impulses } from '../engine/Impulses';
import './installer/settings';
import './toy/settings';

export const gamePipes = (impulses: Impulses, plugins: Pipe[]): Pipe[] => [
  Effects.pipe,
  impulses.pipe,
  Events.pipe,
  Requests.pipe,
  Scheduler.pipe,
  Perf.pipe,
  Errors.pipe,
  ...plugins,
];

const plugins = [
  Scene,
  Phase,
  Mode,
  Rand,
  Sound,
  Messages,
  Image,
  Keys,
  Debug,
  Pause,
  Saves,
  Classic,
  Toy,
  ClassicImages,
  Fps,
  PerfOverlay,
];

export const registerPlugins: Pipe = Composer.pipe(
  ModuleManager.load(Storage),
  ModuleManager.load(Bytes),
  ModuleManager.load(Settings),
  ModuleManager.load(Presets),
  ModuleManager.load(Player),
  ModuleManager.load(Home),
  ModuleManager.load(Assets),
  ModuleManager.load(Local),
  ModuleManager.load(E621),
  ModuleManager.load(PluginInstaller),
  ...plugins.map(ModuleManager.load)
);
