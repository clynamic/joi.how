import { Composer } from '../Composer';
import { Pipe, GameFrame } from '../State';
import { Storage } from '../pipes/Storage';
import { PluginManager } from './PluginManager';
import { pluginPaths, type PluginId, type Plugin } from './Plugins';

const PLUGIN_NAMESPACE = 'core.plugin_installer';

type PluginLoad = {
  promise: Promise<Plugin>;
  result?: Plugin;
  error?: Error;
};

type InstallerState = {
  installed: PluginId[];
};

type InstallerContext = {
  pending: Map<PluginId, PluginLoad>;
};

const ins = pluginPaths<InstallerState, InstallerContext>(PLUGIN_NAMESPACE);

const storageKey = {
  user: `${PLUGIN_NAMESPACE}.user`,
  code: (id: PluginId) => `${PLUGIN_NAMESPACE}.code/${id}`,
};

async function load(code: string): Promise<Plugin> {
  const blob = new Blob([code], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);

  try {
    const module = await import(/* @vite-ignore */ url);
    const plugin: Plugin = module.default || module.plugin;

    if (!plugin || !plugin.id) {
      throw new Error('Plugin must export a Plugin object with an id');
    }

    return plugin;
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
          Composer.do<GameFrame>(({ get, over }) => {
            const installed = get(ins.state.installed) ?? [];
            const pending = get(ins.context.pending);

            if (installed.includes(id) || pending?.has(id)) return;

            if (!code) {
              console.error(
                `[PluginInstaller] plugin "${id}" has no code in storage`
              );
              return;
            }

            over(ins.context.pending, pending => {
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

const resolvePipe: Pipe = Composer.do<GameFrame>(({ get, set, over, pipe }) => {
  const pending = get(ins.context.pending);
  if (!pending?.size) return;

  const resolved: Plugin[] = [];
  const remaining = new Map<PluginId, PluginLoad>();

  for (const [id, entry] of pending) {
    if (entry.result) {
      resolved.push(entry.result);
    } else if (entry.error) {
      // TODO: provide state for failed plugins
      console.error(
        `[PluginInstaller] failed to load plugin "${id}":`,
        entry.error
      );
    } else {
      remaining.set(id, entry);
    }
  }

  if (resolved.length > 0) {
    pipe(...resolved.map(PluginManager.register));
    over(ins.state.installed, (ids = []) => [
      ...ids,
      ...resolved.map(p => p.id),
    ]);
  }

  if (remaining.size !== pending.size) {
    set(ins.context.pending, remaining);
  }
});

export const pluginInstallerPipe: Pipe = Composer.pipe(importPipe, resolvePipe);
