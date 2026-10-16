import {
  definePlugin,
  pluginPaths,
  type Plugin,
  type PluginId,
  type PluginMeta,
} from './Plugins';
import { Composer } from '../Composer';
import { Effects, type Inject } from '../pipes/Effects';
import { Pipe } from '../State';
import { ModuleManager } from '../modules/ModuleManager';

const PLUGIN_ID = 'core.plugin_installer';

type MetaMap = Record<PluginId, PluginMeta>;

export type InstallFailure = { id?: PluginId; message: string };

type InstallerState = {
  installed: PluginId[];
  disabled: PluginId[];
  meta: MetaMap;
  failed: InstallFailure[];
};

type Snapshot = Pick<InstallerState, 'installed' | 'disabled' | 'meta'>;

const ins = pluginPaths<InstallerState>(PLUGIN_ID);

const storageKey = {
  installed: `${PLUGIN_ID}.installed`,
  code: (id: PluginId) => `${PLUGIN_ID}.code/${id}`,
  disabled: `${PLUGIN_ID}.disabled`,
  meta: `${PLUGIN_ID}.meta`,
};

const restore = Effects.define(PLUGIN_ID, 'restore');
const persist = Effects.define<Snapshot>(PLUGIN_ID, 'persist');
const storeCode = Effects.define<{ id: PluginId; code: string }>(
  PLUGIN_ID,
  'store_code'
);
const dropCode = Effects.define<{ id: PluginId }>(PLUGIN_ID, 'drop_code');
const compile = Effects.define<{ code: string }>(PLUGIN_ID, 'compile');
const revive = Effects.define<{ id: PluginId }>(PLUGIN_ID, 'revive');

function readJson<T>(key: string, fallback: T): T {
  return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback));
}

async function loadFromCode(code: string): Promise<Plugin> {
  const blob = new Blob([code], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  try {
    const module = await import(/* @vite-ignore */ url);
    const exported = module.default;
    if (exported?.id) return exported as Plugin;
    throw new Error('Plugin must export a default object with an id field');
  } finally {
    URL.revokeObjectURL(url);
  }
}

function importCode(
  code: string,
  inject: Inject,
  onLoaded: (plugin: Plugin) => Pipe,
  id?: PluginId
) {
  loadFromCode(code).then(
    plugin => inject(onLoaded(plugin)),
    error => inject(PluginInstaller.fail(String(error), id))
  );
}

function restoreFromStorage(inject: Inject) {
  const installed = readJson<PluginId[]>(storageKey.installed, []);
  const disabled = readJson<PluginId[]>(storageKey.disabled, []);
  const meta = readJson<MetaMap>(storageKey.meta, {});
  inject(PluginInstaller.restored({ installed, disabled, meta }));

  for (const id of installed) {
    if (disabled.includes(id)) continue;
    const rawCode = localStorage.getItem(storageKey.code(id));
    if (!rawCode) {
      inject(PluginInstaller.fail('no stored code', id));
      continue;
    }
    importCode(
      JSON.parse(rawCode) as string,
      inject,
      PluginInstaller.loaded,
      id
    );
  }
}

function reviveFromStorage(id: PluginId, inject: Inject) {
  const rawCode = localStorage.getItem(storageKey.code(id));
  if (!rawCode) {
    inject(PluginInstaller.fail('no stored code', id));
    return;
  }
  importCode(JSON.parse(rawCode) as string, inject, PluginInstaller.loaded, id);
}

const persistNow: Pipe = Composer.bind(ins, state =>
  persist.emit({
    installed: state.installed,
    disabled: state.disabled,
    meta: state.meta,
  })
);

const PluginInstaller = definePlugin({
  id: PLUGIN_ID,
  sdk: 'PluginInstaller',

  activate: Composer.pipe(
    Composer.set(ins, { installed: [], disabled: [], meta: {}, failed: [] }),
    restore.emit()
  ),

  deactivate: Composer.set(ins, undefined),

  install(code: string): Pipe {
    return compile.emit({ code });
  },

  remove(id: PluginId): Pipe {
    return Composer.pipe(
      Composer.over(ins, state => ({
        ...state,
        installed: state.installed.filter(i => i !== id),
        disabled: state.disabled.filter(i => i !== id),
        failed: state.failed.filter(f => f.id !== id),
        meta: Object.fromEntries(
          Object.entries(state.meta).filter(([key]) => key !== id)
        ),
      })),
      persistNow,
      dropCode.emit({ id }),
      ModuleManager.unload(id)
    );
  },

  enable(id: PluginId): Pipe {
    return Composer.pipe(
      Composer.over(ins.disabled, ids => ids.filter(i => i !== id)),
      persistNow,
      revive.emit({ id })
    );
  },

  disable(id: PluginId): Pipe {
    return Composer.pipe(
      Composer.over(ins.disabled, ids =>
        ids.includes(id) ? ids : [...ids, id]
      ),
      persistNow,
      ModuleManager.unload(id)
    );
  },

  restored(snapshot: Snapshot): Pipe {
    return Composer.over(ins, state => ({ ...state, ...snapshot }));
  },

  installed(plugin: Plugin, code: string): Pipe {
    return Composer.pipe(
      Composer.over(ins, state => ({
        ...state,
        installed: state.installed.includes(plugin.id)
          ? state.installed
          : [...state.installed, plugin.id],
        meta: plugin.meta
          ? { ...state.meta, [plugin.id]: plugin.meta }
          : state.meta,
      })),
      persistNow,
      storeCode.emit({ id: plugin.id, code }),
      ModuleManager.load(plugin)
    );
  },

  loaded(plugin: Plugin): Pipe {
    return ModuleManager.load(plugin);
  },

  fail(message: string, id?: PluginId): Pipe {
    return Composer.over(ins.failed, failed => [
      ...failed,
      { ...(id !== undefined && { id }), message },
    ]);
  },

  effects: [
    restore.perform((_, inject) => restoreFromStorage(inject)),
    persist.perform(({ installed, disabled, meta }) => {
      localStorage.setItem(storageKey.installed, JSON.stringify(installed));
      localStorage.setItem(storageKey.disabled, JSON.stringify(disabled));
      localStorage.setItem(storageKey.meta, JSON.stringify(meta));
    }),
    storeCode.perform(({ id, code }) =>
      localStorage.setItem(storageKey.code(id), JSON.stringify(code))
    ),
    dropCode.perform(({ id }) => localStorage.removeItem(storageKey.code(id))),
    compile.perform(({ code }, inject) =>
      importCode(code, inject, plugin =>
        PluginInstaller.installed(plugin, code)
      )
    ),
    revive.perform(({ id }, inject) => reviveFromStorage(id, inject)),
  ],
});

export default PluginInstaller;

declare module '../sdk' {
  interface PluginSDK {
    PluginInstaller: typeof PluginInstaller;
  }
}
