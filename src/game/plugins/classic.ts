import { definePlugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { ModuleManager } from '../../engine/modules/ModuleManager';
import { Module } from '../../engine/modules/Module';
import { Scheduler } from '../../engine/pipes/Scheduler';
import { Sequence } from '../Sequence';
import { PLAY_TIMELINE } from '../timelines';
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

const AUTOSAVE_INTERVAL = 10000;

const META = { mode: MODE };

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

const autosave = Sequence.for(PLUGIN_ID, 'autosave');

const start = Composer.pipe(
  ...run.map(ModuleManager.load),
  autosave.after(AUTOSAVE_INTERVAL, 'tick')
);

const stop = Composer.pipe(
  ...run.map(m => ModuleManager.unload(m.id)),
  autosave.cancel()
);

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
    Mode.whenMode(MODE, start)
  ),

  update: Composer.pipe(
    Mode.onEnter(MODE, () => start),
    Mode.onLeave(MODE, () => stop),
    Scheduler.onStop(PLAY_TIMELINE, () =>
      Mode.whenMode(MODE, Saves.save(AUTO_SLOT, META))
    ),
    autosave.on('tick', () =>
      Composer.pipe(
        Saves.save(AUTO_SLOT, META),
        autosave.after(AUTOSAVE_INTERVAL, 'tick')
      )
    ),
    Scene.onLeave('end', () => Saves.fresh())
  ),

  deactivate: Composer.pipe(Mode.unregister(MODE), stop),
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Classic: typeof Classic;
  }
}

export default Classic;
