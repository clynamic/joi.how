import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { Effects } from '../../engine/pipes/Effects';
import { GameFrame, Pipe } from '../../engine/State';
import PluginInstaller from '../../engine/plugins/PluginInstaller';
import { bytes, PluginBytes } from './store';

const PLUGIN_ID = 'how.joi.bytes';

type BytesState = { sweeping?: boolean };

const paths = pluginPaths<BytesState>(PLUGIN_ID);

const clear = Effects.define<{ prefix: string }>(PLUGIN_ID, 'clear');
const sweep = Effects.define<{ live: string[] }>(PLUGIN_ID, 'sweep');

export type BytesHandle = PluginBytes & { clear: (prefix?: string) => Pipe };

const pluginOf = (key: string) => key.slice(0, key.indexOf('/'));

const Bytes = definePlugin({
  sdk: 'Bytes',
  id: PLUGIN_ID,
  meta: {
    name: 'Bytes',
  },

  for: (plugin: string): BytesHandle => ({
    ...bytes.for(plugin),
    clear: (prefix = '') => clear.emit({ prefix: `${plugin}/${prefix}` }),
  }),

  activate: Composer.set(paths, { sweeping: true }),

  update: Composer.pipe(
    PluginInstaller.onRemove(() => Composer.set(paths.sweeping, true)),
    Composer.do<GameFrame>(({ get, set, pipe }) => {
      if (!get(paths.sweeping)) return;
      const live = PluginInstaller.plugins(get());
      if (!live) return;
      set(paths.sweeping, false);
      pipe(sweep.emit({ live }));
    })
  ),

  deactivate: Composer.set(paths, undefined),

  effects: [
    clear.perform(async ({ prefix }) => bytes.delete(await bytes.keys(prefix))),
    sweep.perform(async ({ live }) => {
      const plugins = new Set(live);
      const keys = await bytes.keys();
      await bytes.delete(keys.filter(key => !plugins.has(pluginOf(key))));
    }),
  ],
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Bytes: typeof Bytes;
  }
}

export default Bytes;
