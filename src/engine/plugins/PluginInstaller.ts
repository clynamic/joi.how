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
import Storage from './Storage';

const PLUGIN_ID = 'core.plugin_installer';

type MetaMap = Record<PluginId, PluginMeta>;

export type InstallFailure = { id?: PluginId; message: string };

type InstallerState = {
  installed: PluginId[];
  disabled: PluginId[];
  meta: MetaMap;
  failed: InstallFailure[];
  ready: boolean;
};

type Snapshot = Pick<InstallerState, 'installed' | 'disabled' | 'meta'>;

const ins = pluginPaths<InstallerState>(PLUGIN_ID);

const INDEX_KEY = `${PLUGIN_ID}.index`;
const CODE_PREFIX = `${PLUGIN_ID}.code/`;
const codeKey = (id: PluginId) => `${CODE_PREFIX}${id}`;
const idOf = (key: string) => key.slice(CODE_PREFIX.length);

const compile = Effects.define<{ code: string; id?: PluginId }>(
  PLUGIN_ID,
  'compile'
);

const isSnapshot = (value: unknown): value is Snapshot =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as Snapshot).installed) &&
  Array.isArray((value as Snapshot).disabled);

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
    error => inject(fail(String(error), id))
  );
}

const persistNow: Pipe = Composer.bind(ins, state =>
  state.ready
    ? Storage.write(INDEX_KEY, {
        installed: state.installed,
        disabled: state.disabled,
        meta: state.meta,
      })
    : frame => frame
);

const union = (a: PluginId[], b: PluginId[]) => [
  ...a,
  ...b.filter(id => !a.includes(id)),
];

const restored = (snapshot: Snapshot): Pipe =>
  Composer.over(ins, state => ({
    ...state,
    installed: union(snapshot.installed, state.installed),
    disabled: union(snapshot.disabled, state.disabled),
    meta: { ...snapshot.meta, ...state.meta },
  }));

const wanted = (state: InstallerState | undefined, id: PluginId) =>
  !!state?.installed.includes(id) && !state.disabled.includes(id);

const settled = (id: PluginId): Pipe =>
  Composer.over(ins.failed, failed => failed.filter(f => f.id !== id));

const loaded = (plugin: Plugin): Pipe =>
  Composer.bind(ins, state =>
    Composer.when(
      wanted(state, plugin.id),
      Composer.pipe(settled(plugin.id), ModuleManager.load(plugin))
    )
  );

const fail = (message: string, id?: PluginId): Pipe =>
  Composer.over(ins.failed, failed =>
    failed.some(f => f.id === id && f.message === message)
      ? failed
      : [...failed, { ...(id !== undefined && { id }), message }]
  );

const installed = (plugin: Plugin, code: string): Pipe =>
  Composer.pipe(
    Composer.over(ins, state => ({
      ...state,
      installed: state.installed.includes(plugin.id)
        ? state.installed
        : [...state.installed, plugin.id],
      meta: plugin.meta
        ? { ...state.meta, [plugin.id]: plugin.meta }
        : state.meta,
    })),
    settled(plugin.id),
    persistNow,
    Storage.write(codeKey(plugin.id), code),
    ModuleManager.load(plugin)
  );

const PluginInstaller = definePlugin({
  id: PLUGIN_ID,
  sdk: 'PluginInstaller',

  activate: Composer.pipe(
    Composer.set(ins, {
      installed: [],
      disabled: [],
      meta: {},
      failed: [],
      ready: false,
    }),
    Storage.read(INDEX_KEY)
  ),

  update: Composer.pipe(
    Storage.onRead(INDEX_KEY, value =>
      Composer.do(({ get, set, pipe }) => {
        if (value !== null && !isSnapshot(value)) {
          pipe(fail('stored plugin index is not readable'));
        }
        if (isSnapshot(value)) pipe(restored(value));
        set(ins.ready, true);
        pipe(persistNow);
        const state = get(ins);
        for (const id of state.installed) {
          if (!wanted(state, id)) continue;
          pipe(Storage.read(codeKey(id)));
        }
      })
    ),
    Storage.onReadPrefix(CODE_PREFIX, (code, key) =>
      Composer.bind(ins, state => {
        const id = idOf(key);
        if (!wanted(state, id)) return frame => frame;
        return typeof code === 'string'
          ? compile.emit({ code, id })
          : fail('no stored code', id);
      })
    )
  ),

  deactivate: Composer.set(ins, undefined),

  install: (code: string): Pipe => compile.emit({ code }),

  remove: (id: PluginId): Pipe =>
    Composer.pipe(
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
      Storage.remove(codeKey(id)),
      ModuleManager.unload(id)
    ),

  enable: (id: PluginId): Pipe =>
    Composer.pipe(
      Composer.over(ins.disabled, ids => ids.filter(i => i !== id)),
      persistNow,
      Storage.read(codeKey(id))
    ),

  disable: (id: PluginId): Pipe =>
    Composer.pipe(
      Composer.over(ins.disabled, ids =>
        ids.includes(id) ? ids : [...ids, id]
      ),
      persistNow,
      ModuleManager.unload(id)
    ),

  restored,

  installed,

  loaded,

  fail,

  effects: [
    compile.perform(({ code, id }, inject) =>
      importCode(
        code,
        inject,
        id === undefined ? plugin => installed(plugin, code) : loaded,
        id
      )
    ),
  ],
});

export default PluginInstaller;

declare module '../sdk' {
  interface PluginSDK {
    PluginInstaller: typeof PluginInstaller;
  }
}
