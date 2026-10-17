import { describe, it, expect, beforeEach } from 'vitest';
import PluginInstaller from '../../../src/engine/plugins/PluginInstaller';
import Storage from '../../../src/engine/plugins/Storage';
import {
  ModuleManager,
  moduleManagerPipe,
} from '../../../src/engine/modules/ModuleManager';
import { Effects } from '../../../src/engine/pipes/Effects';
import { Events } from '../../../src/engine/pipes/Events';
import { Composer } from '../../../src/engine/Composer';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { makeFrame, tick } from '../../utils';

const PLUGIN_NAMESPACE = 'core.plugin_installer';

const basePipe: Pipe = Composer.pipe(Events.pipe, moduleManagerPipe);
const fullPipe: Pipe = Composer.pipe(Effects.pipe, basePipe);

const getInstalledIds = (frame: GameFrame): string[] =>
  frame?.core?.plugin_installer?.installed ?? [];

const getDisabledIds = (frame: GameFrame): string[] =>
  frame?.core?.plugin_installer?.disabled ?? [];

const getFailed = (frame: GameFrame): { id?: string; message: string }[] =>
  frame?.core?.plugin_installer?.failed ?? [];

const getMeta = (frame: GameFrame): Record<string, any> =>
  frame?.core?.plugin_installer?.meta ?? {};

const getEffects = (frame: GameFrame): { type: string; payload?: unknown }[] =>
  (frame?.core?.effects?.queue ?? []).filter((e: { type: string }) =>
    e.type.startsWith(PLUGIN_NAMESPACE)
  );

const stored = (key: string) =>
  JSON.parse(localStorage.getItem(`${PLUGIN_NAMESPACE}.${key}`) ?? 'null');

function settle(frame: GameFrame, rounds = 4): GameFrame {
  for (let i = 0; i < rounds; i++) {
    const injected: Pipe[] = [];
    Effects.flush(frame, pipe => injected.push(pipe));
    frame = Composer.pipe(Effects.pipe, ...injected, basePipe)(tick(frame));
  }
  return frame;
}

function bootstrap(): GameFrame {
  const frame0 = fullPipe(makeFrame());
  const frame1 = Composer.pipe(
    ModuleManager.load(Storage),
    ModuleManager.load(PluginInstaller)
  )(frame0);
  return settle(fullPipe(tick(frame1)));
}

function seed(
  installed: string[],
  disabled: string[] = [],
  meta: Record<string, unknown> = {}
) {
  localStorage.setItem(
    `${PLUGIN_NAMESPACE}.index`,
    JSON.stringify({ installed, disabled, meta })
  );
  for (const id of installed) {
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.code/${id}`,
      JSON.stringify(`export default { id: "${id}" }`)
    );
  }
}

describe('Plugin Installer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty state', () => {
    const frame = bootstrap();

    expect(getInstalledIds(frame)).toEqual([]);
    expect(getDisabledIds(frame)).toEqual([]);
    expect(getFailed(frame)).toEqual([]);
    expect(getMeta(frame)).toEqual({});
  });

  it('should ask storage for its index on activate', () => {
    const frame0 = fullPipe(makeFrame());
    const frame = fullPipe(tick(ModuleManager.load(PluginInstaller)(frame0)));

    expect(frame.core.effects.queue).toEqual([
      {
        type: 'core.storage/read',
        payload: { key: `${PLUGIN_NAMESPACE}.index` },
      },
    ]);
  });

  it('should load installed ids from storage on activate', () => {
    seed(['user.test']);

    const frame = bootstrap();
    expect(getInstalledIds(frame)).toEqual(['user.test']);
  });

  it('should load disabled ids from storage on activate', () => {
    seed([], ['user.disabled']);

    const frame = bootstrap();
    expect(getDisabledIds(frame)).toEqual(['user.disabled']);
  });

  it('should load meta from storage on activate', () => {
    const meta = { 'user.test': { name: 'Test', version: '1.0' } };
    seed([], [], meta);

    const frame = bootstrap();
    expect(getMeta(frame)).toEqual(meta);
  });

  it('should mark plugins with no code as failed', () => {
    seed(['user.nocode']);
    localStorage.removeItem(`${PLUGIN_NAMESPACE}.code/user.nocode`);

    const frame = bootstrap();
    expect(getFailed(frame)).toEqual([
      { id: 'user.nocode', message: 'no stored code' },
    ]);
  });

  it('should skip disabled plugins during activation', () => {
    seed(['user.test'], ['user.test']);
    localStorage.removeItem(`${PLUGIN_NAMESPACE}.code/user.test`);

    const frame = bootstrap();
    expect(getInstalledIds(frame)).toEqual(['user.test']);
    expect(getDisabledIds(frame)).toEqual(['user.test']);
    expect(getFailed(frame)).toEqual([]);
  });

  it('should queue a compile effect on install', () => {
    const frame = PluginInstaller.install('export default {}')(bootstrap());

    expect(getEffects(frame)).toEqual([
      {
        type: `${PLUGIN_NAMESPACE}/compile`,
        payload: { code: 'export default {}' },
      },
    ]);
  });

  it('should register a compiled plugin, persist it and load it', () => {
    const plugin = { id: 'user.new', meta: { name: 'New' } };
    let frame = PluginInstaller.installed(plugin, 'code!')(bootstrap());
    const effects = frame.core.effects.queue.map(
      (e: { type: string; payload?: { key?: string } }) => [
        e.type,
        e.payload?.key,
      ]
    );
    frame = settle(frame);

    expect(effects).toEqual([
      ['core.storage/write', `${PLUGIN_NAMESPACE}.index`],
      ['core.storage/write', `${PLUGIN_NAMESPACE}.code/user.new`],
    ]);
    expect(getInstalledIds(frame)).toEqual(['user.new']);
    expect(getMeta(frame)).toEqual({ 'user.new': { name: 'New' } });
    expect(stored('index').installed).toEqual(['user.new']);
    expect(stored('index').meta).toEqual({ 'user.new': { name: 'New' } });
    expect(stored('code/user.new')).toBe('code!');
    expect(frame.core.modules.order).toContain('user.new');
  });

  it('should not install the same plugin twice', () => {
    const plugin = { id: 'user.twice' };
    let frame = PluginInstaller.installed(plugin, 'a')(bootstrap());
    frame = settle(frame);
    frame = settle(PluginInstaller.installed(plugin, 'b')(frame));

    expect(getInstalledIds(frame)).toEqual(['user.twice']);
    expect(stored('code/user.twice')).toBe('b');
  });

  it('should remove plugin from storage and state', () => {
    seed(['user.remove'], [], { 'user.remove': { name: 'Remove Me' } });

    let frame = bootstrap();
    expect(getInstalledIds(frame)).toContain('user.remove');

    frame = settle(PluginInstaller.remove('user.remove')(frame));

    expect(getInstalledIds(frame)).not.toContain('user.remove');
    expect(getMeta(frame)).not.toHaveProperty('user.remove');
    expect(stored('code/user.remove')).toBeNull();
    expect(stored('index').installed).not.toContain('user.remove');
  });

  it('should add to disabled array on disable', () => {
    seed(['user.dis']);

    let frame = bootstrap();
    expect(getDisabledIds(frame)).not.toContain('user.dis');

    frame = settle(PluginInstaller.disable('user.dis')(frame));

    expect(getDisabledIds(frame)).toContain('user.dis');
    expect(stored('index').disabled).toContain('user.dis');
  });

  it('should remove from disabled array and revive on enable', () => {
    seed(['user.en'], ['user.en']);

    let frame = bootstrap();
    expect(getDisabledIds(frame)).toContain('user.en');

    frame = PluginInstaller.enable('user.en')(frame);
    const effects = frame.core.effects.queue.map(
      (e: { type: string; payload?: { key?: string } }) => [
        e.type,
        e.payload?.key,
      ]
    );
    frame = settle(frame);

    expect(effects).toEqual([
      ['core.storage/write', `${PLUGIN_NAMESPACE}.index`],
      ['core.storage/read', `${PLUGIN_NAMESPACE}.code/user.en`],
    ]);
    expect(getDisabledIds(frame)).not.toContain('user.en');
    expect(stored('index').disabled).not.toContain('user.en');
  });

  it('should not duplicate disabled entries', () => {
    seed(['user.dup']);

    let frame = bootstrap();
    frame = settle(PluginInstaller.disable('user.dup')(frame));
    frame = settle(PluginInstaller.disable('user.dup')(frame));

    expect(getDisabledIds(frame).filter(id => id === 'user.dup')).toHaveLength(
      1
    );
    expect(stored('index').disabled).toEqual(['user.dup']);
  });

  it('should clean up disabled on remove', () => {
    seed(['user.cr'], ['user.cr']);

    let frame = bootstrap();
    frame = settle(PluginInstaller.remove('user.cr')(frame));

    expect(getDisabledIds(frame)).not.toContain('user.cr');
    expect(getInstalledIds(frame)).not.toContain('user.cr');
    expect(stored('index').disabled).toEqual([]);
  });

  it('should persist a plugin registered through inject', () => {
    const frame = bootstrap();
    const injected = [PluginInstaller.installed({ id: 'user.late' }, 'late')];

    const next = Composer.pipe(
      Effects.pipe,
      ...injected,
      basePipe
    )(tick(frame));
    Effects.flush(next, () => undefined);

    expect(stored('index').installed).toEqual(['user.late']);
    expect(stored('code/user.late')).toBe('late');
  });

  it('should clear a failure for a plugin that is removed', () => {
    let frame = Composer.pipe(
      PluginInstaller.fail('no stored code', 'user.gone'),
      PluginInstaller.fail('unrelated')
    )(bootstrap());
    frame = settle(PluginInstaller.remove('user.gone')(frame));

    expect(getFailed(frame)).toEqual([{ message: 'unrelated' }]);
  });

  it('should fail an enable for an id with no stored code', () => {
    seed(['user.ghost'], ['user.ghost']);
    localStorage.removeItem(`${PLUGIN_NAMESPACE}.code/user.ghost`);

    let frame = bootstrap();
    frame = settle(PluginInstaller.enable('user.ghost')(frame));

    expect(getFailed(frame)).toEqual([
      { id: 'user.ghost', message: 'no stored code' },
    ]);
  });

  it('should record a failure', () => {
    const frame = PluginInstaller.fail('boom')(bootstrap());

    expect(getFailed(frame)).toEqual([{ message: 'boom' }]);
  });

  it('should keep one failure per plugin and message and clear it once the plugin loads', () => {
    let frame = bootstrap();
    frame = PluginInstaller.fail('boom', 'user.a')(frame);
    frame = PluginInstaller.fail('boom', 'user.a')(frame);
    frame = PluginInstaller.fail('bang', 'user.a')(frame);
    const before = getFailed(frame);

    frame = settle(PluginInstaller.installed({ id: 'user.a' }, 'code')(frame));

    expect(before).toEqual([
      { id: 'user.a', message: 'boom' },
      { id: 'user.a', message: 'bang' },
    ]);
    expect(getFailed(frame)).toEqual([]);
  });

  it('should not load a plugin that was removed while its code compiled', () => {
    seed(['user.late']);
    let frame = settle(PluginInstaller.remove('user.late')(bootstrap()));

    frame = settle(PluginInstaller.loaded({ id: 'user.late' })(frame));

    expect(frame.core.modules.order).not.toContain('user.late');
  });

  it('should not compile code that arrives for a plugin disabled meanwhile', () => {
    seed(['user.slow']);
    let frame = settle(PluginInstaller.disable('user.slow')(bootstrap()));

    frame = Composer.pipe(
      Events.dispatch({
        type: 'core.storage/read',
        payload: { key: `${PLUGIN_NAMESPACE}.code/user.slow`, value: 'code' },
      }),
      fullPipe
    )(tick(frame));

    expect(getEffects(frame)).toEqual([]);
  });

  it('should keep an index that arrives after an install', () => {
    const frame0 = fullPipe(makeFrame());
    let frame = Composer.pipe(
      ModuleManager.load(Storage),
      ModuleManager.load(PluginInstaller)
    )(frame0);
    frame = fullPipe(tick(frame));
    frame = PluginInstaller.installed({ id: 'user.early' }, 'code')(frame);
    seed(['user.stored']);

    frame = settle(frame);

    expect([...getInstalledIds(frame)].sort()).toEqual([
      'user.early',
      'user.stored',
    ]);
    expect([...stored('index').installed].sort()).toEqual([
      'user.early',
      'user.stored',
    ]);
  });

  it('should report an index that is not readable and carry on', () => {
    localStorage.setItem(`${PLUGIN_NAMESPACE}.index`, '"nope"');

    const frame = bootstrap();

    expect(getFailed(frame)).toEqual([
      { message: 'stored plugin index is not readable' },
    ]);
    expect(getInstalledIds(frame)).toEqual([]);
  });
});
