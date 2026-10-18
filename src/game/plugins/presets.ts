import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { Documents, DocumentState } from './documents';
import { legacyDocument, LegacyState, legacyPresets } from './legacy';

const PLUGIN_ID = 'core.presets';

const paths = pluginPaths<DocumentState & LegacyState>(PLUGIN_ID);

const documents = Documents.define(PLUGIN_ID, paths);

const legacy = legacyDocument(documents, paths, legacyPresets);

const Presets = definePlugin({
  sdk: 'Presets',
  id: PLUGIN_ID,
  meta: {
    name: 'Presets',
  },

  read: documents.read,
  write: documents.write,
  replace: documents.replace,
  keys: documents.keys,
  select: documents.select,
  drop: documents.drop,
  list: documents.list,
  find: documents.find,

  activate: documents.activate,

  update: Composer.pipe(
    documents.update,
    documents.onMissing(() => legacy.start()),
    legacy.update
  ),

  deactivate: documents.deactivate,

  get paths() {
    return paths;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Presets: typeof Presets;
  }
}

export default Presets;
