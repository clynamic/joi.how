import { definePlugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { ModuleManager } from '../../engine/modules/ModuleManager';
import { Module } from '../../engine/modules/Module';
import Mode from './mode';
import Scene from './scene';
import Saves, { AUTO_SLOT } from './saves';
import Clock from './clock';
import Intensity from './intensity';
import Pace from './pace';
import Stroke from './stroke';
import RandomImages from './randomImages';
import Hypno from './hypno';
import Dealer from './dealer';
import Warmup from './warmup';
import EmergencyStop from './emergencyStop';
import Cues from './cues';

const PLUGIN_ID = 'core.classic';

const MODE = 'classic';

const run: Module[] = [
  Clock,
  Intensity,
  Pace,
  Stroke,
  RandomImages,
  Hypno,
  Dealer,
  Warmup,
  EmergencyStop,
  Cues,
];

const load = Composer.pipe(...run.map(ModuleManager.load));
const unload = Composer.pipe(...run.map(m => ModuleManager.unload(m.id)));

const Classic = definePlugin({
  sdk: 'Classic',
  id: PLUGIN_ID,
  meta: {
    name: 'Classic',
    description: 'Stroke to the beat with dice outcomes until the climax',
  },
  ordering: {
    loadAfter: [Mode.id, Scene.id, Saves.id],
  },

  activate: Composer.pipe(
    Mode.register({ id: MODE, name: 'Classic' }),
    Mode.whenMode(MODE, load)
  ),

  update: Composer.pipe(
    Mode.onEnter(MODE, () => load),
    Mode.onLeave(MODE, () => unload),
    Scene.onLeave('end', () =>
      Composer.pipe(Saves.drop(AUTO_SLOT), Saves.reset())
    )
  ),

  deactivate: Composer.pipe(Mode.unregister(MODE), unload),
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Classic: typeof Classic;
  }
}

export default Classic;
