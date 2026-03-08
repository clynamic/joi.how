import {
  definePlugin,
  pluginPaths,
  type Plugin,
  type PluginId,
  type PluginMeta,
} from './Plugins';
import { Composer } from '../Composer';
import { Pipe } from '../State';
import { ModuleManager } from '../modules/ModuleManager';

const PLUGIN_ID = 'core.plugin_installer';

type MetaMap = Record<PluginId, PluginMeta>;

type InstallerState = {
  installed: PluginId[];
  disabled: PluginId[];
  meta: MetaMap;
  failed: PluginId[];
};

const ins = pluginPaths<InstallerState>(PLUGIN_ID);

const storageKey = {
  installed: `${PLUGIN_ID}.installed`,
  code: (id: PluginId) => `${PLUGIN_ID}.code/${id}`,
  disabled: `${PLUGIN_ID}.disabled`,
  meta: `${PLUGIN_ID}.meta`,
};

function getInstalledIds(): PluginId[] {
  return JSON.parse(localStorage.getItem(storageKey.installed) ?? '[]');
}

function getDisabledIds(): PluginId[] {
  return JSON.parse(localStorage.getItem(storageKey.disabled) ?? '[]');
}

function setDisabledIds(ids: PluginId[]) {
  localStorage.setItem(storageKey.disabled, JSON.stringify(ids));
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

type LoadResult = { plugin: Plugin; code: string };

let loaded: LoadResult[] = [];
let errors: Error[] = [];

function submitLoad(code: string) {
  loadFromCode(code).then(
    plugin => loaded.push({ plugin, code }),
    error => errors.push(error)
  );
}

const PluginInstaller = definePlugin({
  id: PLUGIN_ID,
  name: 'PluginInstaller',

  activate: Composer.do(({ set, over }) => {
    const installed = getInstalledIds();
    const disabled = getDisabledIds();

    const meta: MetaMap = JSON.parse(
      localStorage.getItem(storageKey.meta) ?? '{}'
    );

    set(ins, { installed, disabled, failed: [], meta });

    for (const id of installed) {
      if (disabled.includes(id)) continue;

      const rawCode = localStorage.getItem(storageKey.code(id));
      if (!rawCode) {
        console.error(
          `[PluginInstaller] plugin "${id}" has no code in storage`
        );
        over(ins.failed, (ids = []) => [...ids, id]);
        continue;
      }

      submitLoad(JSON.parse(rawCode) as string);
    }
  }),

  update: Composer.do(({ set, over, pipe }) => {
    if (loaded.length === 0 && errors.length === 0) return;

    if (loaded.length > 0) {
      const batch = loaded;
      loaded = [];

      const installedIds = getInstalledIds();
      const meta: MetaMap = JSON.parse(
        localStorage.getItem(storageKey.meta) ?? '{}'
      );
      const newInstalledIds = [...installedIds];

      for (const { plugin, code } of batch) {
        const id = plugin.id;
        if (!newInstalledIds.includes(id)) newInstalledIds.push(id);
        localStorage.setItem(storageKey.code(id), JSON.stringify(code));
        if (plugin.meta) meta[id] = plugin.meta;
      }

      localStorage.setItem(
        storageKey.installed,
        JSON.stringify(newInstalledIds)
      );
      localStorage.setItem(storageKey.meta, JSON.stringify(meta));
      set(ins.meta, meta);
      pipe(...batch.map(({ plugin }) => ModuleManager.load(plugin)));
      over(ins.installed, (ids = []) => {
        const newIds = batch
          .map(({ plugin }) => plugin.id)
          .filter(id => !ids.includes(id));
        return [...ids, ...newIds];
      });
    }

    if (errors.length > 0) {
      const batch = errors;
      errors = [];

      for (const error of batch) {
        console.error(`[PluginInstaller] failed to load plugin:`, error);
      }
      over(ins.failed, (ids = []) => [...ids, ...batch.map(e => e.message)]);
    }
  }),

  deactivate: Composer.do(() => {
    loaded = [];
    errors = [];
  }),

  install(code: string): Pipe {
    submitLoad(code);
    return Composer.pipe();
  },

  remove(id: PluginId): Pipe {
    return Composer.pipe(
      Composer.do(({ over }) => {
        localStorage.setItem(
          storageKey.installed,
          JSON.stringify(getInstalledIds().filter(i => i !== id))
        );
        localStorage.removeItem(storageKey.code(id));
        setDisabledIds(getDisabledIds().filter(i => i !== id));

        const meta: MetaMap = JSON.parse(
          localStorage.getItem(storageKey.meta) ?? '{}'
        );
        delete meta[id];
        localStorage.setItem(storageKey.meta, JSON.stringify(meta));
        over(ins.meta, (m = {}) => {
          const next = { ...m };
          delete next[id];
          return next;
        });

        over(ins.installed, (ids = []) => ids.filter(i => i !== id));
        over(ins.disabled, (ids = []) => ids.filter(i => i !== id));
        over(ins.failed, (ids = []) => ids.filter(i => i !== id));
      }),
      ModuleManager.unload(id)
    );
  },

  enable(id: PluginId): Pipe {
    return Composer.do(({ over }) => {
      setDisabledIds(getDisabledIds().filter(i => i !== id));
      over(ins.disabled, (ids = []) => ids.filter(i => i !== id));

      const rawCode = localStorage.getItem(storageKey.code(id));
      if (!rawCode) return;

      submitLoad(JSON.parse(rawCode) as string);
    });
  },

  disable(id: PluginId): Pipe {
    return Composer.do(({ over, pipe }) => {
      const disabled = getDisabledIds();
      if (!disabled.includes(id)) {
        setDisabledIds([...disabled, id]);
        over(ins.disabled, (ids = []) => [...ids, id]);
      }

      pipe(ModuleManager.unload(id));
    });
  },
});

export default PluginInstaller;

declare module '../sdk' {
  interface PluginSDK {
    PluginInstaller: typeof PluginInstaller;
  }
}
