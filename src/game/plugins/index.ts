import { ModuleManager } from '../../engine/modules/ModuleManager';
import { Composer } from '../../engine/Composer';
import { Pipe } from '../../engine/State';
import PluginInstaller from '../../engine/plugins/PluginInstaller';
import Scene from './scene';
import Mode from './mode';
import Debug from './debug';
import Fps from './fps';
import Intensity from './intensity';
import Pause from './pause';
import Phase from './phase';
import Pace from './pace';
import PerfOverlay from './perf';
import Image from './image';
import RandomImages from './randomImages';
import Warmup from './warmup';
import Stroke from './stroke';
import Rand from './rand';
import Dealer from './dealer';
import EmergencyStop from './emergencyStop';
import Hypno from './hypno';
import Messages from './messages';
import Clock from './clock';

const plugins = [
  Scene,
  Phase,
  Mode,
  Rand,
  Messages,
  Image,
  Debug,
  Pause,
  Clock,
  Intensity,
  Pace,
  Stroke,
  Dealer,
  Warmup,
  Hypno,
  RandomImages,
  EmergencyStop,
  Fps,
  PerfOverlay,
];

export const registerPlugins: Pipe = Composer.pipe(
  ModuleManager.load(PluginInstaller),
  ...plugins.map(ModuleManager.load)
);
