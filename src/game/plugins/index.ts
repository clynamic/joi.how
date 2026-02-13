import { PluginManager } from '../../engine/plugins/PluginManager';
import { Composer } from '../../engine/Composer';
import { Pipe } from '../../engine/State';
import Fps from './fps';
import Pause from './pause';

const plugins = [Pause.plugin, Fps.plugin];

export const registerPlugins: Pipe = Composer.pipe(
  ...plugins.map(p => PluginManager.register(p))
);
