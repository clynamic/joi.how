import { definePlugin } from '../../engine/plugins/Plugins';
import { bytes, PluginBytes } from '../../services/bytes';

const Bytes = definePlugin({
  sdk: 'Bytes',
  id: 'core.bytes',
  meta: {
    name: 'Bytes',
  },

  for: (plugin: string): PluginBytes => bytes.for(plugin),
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Bytes: typeof Bytes;
  }
}

export default Bytes;
