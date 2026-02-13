import { PluginManager } from '../../engine/plugins/PluginManager';
import { Composer } from '../../engine/Composer';
import { Pipe } from '../../engine/State';
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
import Dealer from './dealer';
import EmergencyStop from './emergencyStop';
import Hypno from './hypno';

const plugins = [
  Pause,
  Phase,
  Pace,
  Intensity,
  Stroke,
  Dealer,
  EmergencyStop,
  Hypno,
  Image,
  RandomImages,
  Warmup,
  Fps,
  PerfOverlay,
];

export const registerPlugins: Pipe = Composer.pipe(
  ...plugins.map(PluginManager.register)
);
