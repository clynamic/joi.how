import { definePlugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { ModuleManager } from '../../engine/modules/ModuleManager';
import { Module } from '../../engine/modules/Module';
import { Scheduler } from '../../engine/pipes/Scheduler';
import { Sequence } from '../Sequence';
import Pause from '../pause';
import Mode from '../mode';
import Scene from '../scene';
import Saves from '../saves';
import Clock from './clock';
import Intensity from './intensity';
import Pace from './pace';
import Stroke from './stroke';
import RandomImages from './randomImages';
import Hypno from './hypno';
import Dealer from './dice';
import Warmup from './warmup';
import EmergencyStop from './emergencyStop';
import Cues from './cues';
import './dice/result';
import './dice/settings';
import './dice/climaxSettings';
import './hypno/settings';
import './play';
import './summary';
import './setup/duration';
import './setup/board';
import './images/gallery';
import './setup/pace';
import './setup/sources';

const PLUGIN_ID = 'how.joi.classic';

const MODE = 'classic';

const AUTOSAVE_INTERVAL = 10000;

const SLOT = MODE;
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

const save = Mode.whenMode(MODE, Saves.save(SLOT, META));

const start = Composer.pipe(
  ...run.map(ModuleManager.load),
  Saves.load(SLOT),
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
    Scheduler.onStop(Pause.timeline, () => Scene.whenScene('game', save)),
    Scene.onLeave('game', () =>
      Composer.bind(Scene.paths, scene =>
        Composer.when(scene.current !== 'end', save)
      )
    ),
    autosave.on('tick', () =>
      Composer.pipe(
        Scene.whenScene('game', save),
        autosave.after(AUTOSAVE_INTERVAL, 'tick')
      )
    ),
    Scene.onLeave('end', () => Saves.fresh(SLOT))
  ),

  deactivate: Composer.pipe(Mode.unregister(MODE), stop),
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Classic: typeof Classic;
  }
}

export default Classic;
