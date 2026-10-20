import { definePlugin } from '../../engine/plugins/Plugins';
import { Effects } from '../../engine/pipes/Effects';
import { Pipe } from '../../engine/State';
import { bytes, PluginBytes } from '../../services/bytes';

const PLUGIN_ID = 'core.bytes';

const clear = Effects.define<{ prefix: string }>(PLUGIN_ID, 'clear');

export type BytesHandle = PluginBytes & { clear: (prefix?: string) => Pipe };

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

  effects: [
    clear.perform(async ({ prefix }) => bytes.delete(await bytes.keys(prefix))),
  ],
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Bytes: typeof Bytes;
  }
}

export default Bytes;
