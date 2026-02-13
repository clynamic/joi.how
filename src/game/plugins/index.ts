import { PluginManager } from '../../engine/plugins/PluginManager';
import { Composer } from '../../engine/Composer';
import { Pipe } from '../../engine/State';
import { createFpsPlugin } from './fps';
import { createPausePlugin } from './pause';

const plugins = [createPausePlugin(), createFpsPlugin()];

export const registerPlugins: Pipe = Composer.pipe(
  ...plugins.map(p => PluginManager.register(p))
);
