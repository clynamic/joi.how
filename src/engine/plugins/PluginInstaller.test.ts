import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { pluginInstallerPipe } from './PluginInstaller';
import { pluginManagerPipe } from './PluginManager';
import { Events } from '../pipes/Events';
import { Composer } from '../Composer';
import { GameFrame, Pipe } from '../State';
import { sdk } from '../sdk';
import type { Plugin, PluginClass } from './Plugins';

const PLUGIN_NAMESPACE = 'core.plugin_installer';

const makeFrame = (overrides?: Partial<GameFrame>): GameFrame => ({
  state: {},
  context: { tick: 0, step: 16, time: 0 },
  ...overrides,
});

const tick = (frame: GameFrame): GameFrame => ({
  ...frame,
  context: {
    ...frame.context,
    tick: frame.context.tick + 1,
    step: 16,
    time: frame.context.time + 16,
  },
});

const fullPipe: Pipe = Composer.pipe(
  Events.pipe,
  pluginManagerPipe,
  pluginInstallerPipe
);

const getPending = (frame: GameFrame): Map<string, any> | undefined =>
  (frame.context as any)?.core?.plugin_installer?.pending;

const getInstalledIds = (frame: GameFrame): string[] =>
  (frame.state as any)?.core?.plugin_installer?.installed ?? [];

const getLoadedIds = (frame: GameFrame): string[] =>
  (frame.state as any)?.core?.plugin_manager?.loaded ?? [];

function makeLoadResult(plugin: Plugin, name: string) {
  const cls = { plugin, name } as PluginClass;
  return {
    promise: Promise.resolve(cls),
    result: cls,
  };
}

describe('Plugin Installer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    delete (sdk as any).TestPlugin;
  });

  it('should create pending entries from storage', () => {
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.user`,
      JSON.stringify(['user.test'])
    );
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.code/user.test`,
      JSON.stringify(
        `export default class Test { static plugin = { id: 'user.test' } }`
      )
    );

    const result = pluginInstallerPipe(makeFrame());
    const pending = getPending(result);

    expect(pending).toBeInstanceOf(Map);
    expect(pending!.has('user.test')).toBe(true);
    expect(pending!.get('user.test')).toHaveProperty('promise');
  });

  it('should skip plugins with no code in storage', () => {
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.user`,
      JSON.stringify(['user.nocode'])
    );

    const result = pluginInstallerPipe(makeFrame());
    expect(getPending(result)?.has('user.nocode')).toBeFalsy();
  });

  it('should skip already installed plugins', () => {
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.user`,
      JSON.stringify(['user.test'])
    );
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.code/user.test`,
      JSON.stringify(`code`)
    );

    const result = pluginInstallerPipe(
      makeFrame({
        state: { core: { plugin_installer: { installed: ['user.test'] } } },
      })
    );

    expect(getPending(result)?.has('user.test')).toBeFalsy();
  });

  it('should register resolved plugins with PluginManager', () => {
    let activated = false;
    const testPlugin: Plugin = {
      id: 'user.resolved',
      activate: frame => {
        activated = true;
        return frame;
      },
    };

    const frame0 = fullPipe(makeFrame());

    const frame1 = Composer.set(
      ['context', 'core', 'plugin_installer', 'pending'],
      new Map([['user.resolved', makeLoadResult(testPlugin, 'TestPlugin')]])
    )(frame0);

    const frame2 = fullPipe(tick(frame1));

    expect(getInstalledIds(frame2)).toContain('user.resolved');

    const frame3 = fullPipe(tick(frame2));

    expect(activated).toBe(true);
    expect(getLoadedIds(frame3)).toContain('user.resolved');
  });

  it('should register plugin class on sdk by name', () => {
    const testPlugin: Plugin = { id: 'user.sdk' };

    const frame0 = fullPipe(makeFrame());

    const frame1 = Composer.set(
      ['context', 'core', 'plugin_installer', 'pending'],
      new Map([['user.sdk', makeLoadResult(testPlugin, 'TestPlugin')]])
    )(frame0);

    const frame2 = fullPipe(tick(frame1));
    fullPipe(tick(frame2));

    expect((sdk as any).TestPlugin).toBeDefined();
    expect((sdk as any).TestPlugin.plugin.id).toBe('user.sdk');
  });

  it('should drop errored plugins from pending', () => {
    const error = new Error('load failed');

    const frame0 = fullPipe(makeFrame());

    const frame1 = Composer.set(
      ['context', 'core', 'plugin_installer', 'pending'],
      new Map([
        [
          'user.broken',
          {
            promise: Promise.reject(error).catch(() => {}),
            error,
          },
        ],
      ])
    )(frame0);

    const frame2 = fullPipe(tick(frame1));

    expect(getPending(frame2)?.has('user.broken')).toBeFalsy();
    expect(getInstalledIds(frame2)).not.toContain('user.broken');
  });
});
