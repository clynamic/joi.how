import { Composer } from '../Composer';
import { Pipe } from '../State';
import { Storage } from '../pipes/Storage';
import { PluginManager } from './PluginManager';
import { pluginPaths, type Plugin, type PluginId } from './Plugins';

const PLUGIN_NAMESPACE = 'core.plugin_installer';

type PluginLoad = {
  promise: Promise<Plugin>;
  result?: Plugin;
  error?: Error;
};

type InstallerState = {
  installed: PluginId[];
  failed: PluginId[];
  pending: Map<PluginId, PluginLoad>;
};

const ins = pluginPaths<InstallerState>(PLUGIN_NAMESPACE);

const storageKey = {
  user: `${PLUGIN_NAMESPACE}.user`,
  code: (id: PluginId) => `${PLUGIN_NAMESPACE}.code/${id}`,
};

async function load(code: string): Promise<Plugin> {
  const blob = new Blob([code], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);

  try {
    const module = await import(/* @vite-ignore */ url);
    const exported = module.default;

    if (exported?.id) return exported as Plugin;

    throw new Error(
      'Plugin must export a default object with an id field'
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

const importPipe: Pipe = Storage.bind<PluginId[]>(
  storageKey.user,
  (userPluginIds = []) =>
    Composer.pipe(
      ...userPluginIds.map(id =>
        Storage.bind<string>(storageKey.code(id), code =>
          Composer.do(({ get, over }) => {
            const installed = get(ins.installed) ?? [];
            const failed = get(ins.failed) ?? [];
            const pending = get(ins.pending);

            if (
              installed.includes(id) ||
              failed.includes(id) ||
              pending?.has(id)
            )
              return;

            if (!code) {
              console.error(
                `[PluginInstaller] plugin "${id}" has no code in storage`
              );
              over(ins.failed, (ids = []) => [
                ...(Array.isArray(ids) ? ids : []),
                id,
              ]);
              return;
            }

            over(ins.pending, pending => {
              if (!(pending instanceof Map)) pending = new Map();
              // TODO: generic async resolver pipe?
              const pluginLoad: PluginLoad = {
                promise: load(code),
              };
              pluginLoad.promise.then(
                plugin => {
                  pluginLoad.result = plugin;
                },
                error => {
                  pluginLoad.error = error;
                }
              );
              return new Map([...pending, [id, pluginLoad]]);
            });
          })
        )
      )
    )
);

const resolvePipe: Pipe = Composer.do(({ get, set, over, pipe }) => {
  const pending = get(ins.pending);
  if (!pending?.size) return;

  const resolved: Plugin[] = [];
  const failed: PluginId[] = [];
  const remaining = new Map<PluginId, PluginLoad>();

  for (const [id, entry] of pending) {
    if (entry.result) {
      resolved.push(entry.result);
    } else if (entry.error) {
      console.error(
        `[PluginInstaller] failed to load plugin "${id}":`,
        entry.error
      );
      failed.push(id);
    } else {
      remaining.set(id, entry);
    }
  }

  if (resolved.length > 0) {
    pipe(...resolved.map(PluginManager.register));
    over(ins.installed, (ids = []) => [
      ...(Array.isArray(ids) ? ids : []),
      ...resolved.map(plugin => plugin.id),
    ]);
  }

  if (failed.length > 0) {
    over(ins.failed, (ids = []) => [
      ...(Array.isArray(ids) ? ids : []),
      ...failed,
    ]);
  }

  if (remaining.size !== pending.size) {
    set(ins.pending, remaining);
  }
});

export const pluginInstallerPipe: Pipe = Composer.pipe(importPipe, resolvePipe);
