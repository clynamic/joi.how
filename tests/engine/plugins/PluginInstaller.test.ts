import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { pluginInstallerPipe } from '../../../src/engine/plugins/PluginInstaller';
import { pluginManagerPipe } from '../../../src/engine/plugins/PluginManager';
import { moduleManagerPipe } from '../../../src/engine/modules/ModuleManager';
import { Events } from '../../../src/engine/pipes/Events';
import { Composer } from '../../../src/engine/Composer';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { sdk } from '../../../src/engine/sdk';
import type { Plugin } from '../../../src/engine/plugins/Plugins';
import { makeFrame, tick } from '../../utils';

const PLUGIN_NAMESPACE = 'core.plugin_installer';

const fullPipe: Pipe = Composer.pipe(
  Events.pipe,
  moduleManagerPipe,
  pluginManagerPipe,
  pluginInstallerPipe
);

const getPending = (frame: GameFrame): Map<string, any> | undefined =>
  frame?.core?.plugin_installer?.pending;

const getInstalledIds = (frame: GameFrame): string[] =>
  frame?.core?.plugin_installer?.installed ?? [];

const getOrder = (frame: GameFrame): string[] =>
  (frame as any)?.core?.modules?.order ?? [];

function makeLoadResult(plugin: Plugin) {
  return {
    promise: Promise.resolve(plugin),
    result: plugin,
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
        core: { plugin_installer: { installed: ['user.test'] } },
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
      ['core', 'plugin_installer', 'pending'],
      new Map([['user.resolved', makeLoadResult(testPlugin)]])
    )(frame0);

    const frame2 = fullPipe(tick(frame1));

    expect(getInstalledIds(frame2)).toContain('user.resolved');

    const frame3 = fullPipe(tick(frame2));
    const frame4 = fullPipe(tick(frame3));

    expect(activated).toBe(true);
    expect(getOrder(frame4)).toContain('user.resolved');
  });

  it('should register plugin on sdk by name', () => {
    const testPlugin: Plugin = { id: 'user.sdk', name: 'TestPlugin' };

    const frame0 = fullPipe(makeFrame());

    const frame1 = Composer.set(
      ['core', 'plugin_installer', 'pending'],
      new Map([['user.sdk', makeLoadResult(testPlugin)]])
    )(frame0);

    const frame2 = fullPipe(tick(frame1));
    const frame3 = fullPipe(tick(frame2));
    fullPipe(tick(frame3));

    expect((sdk as any).TestPlugin).toBeDefined();
    expect((sdk as any).TestPlugin.id).toBe('user.sdk');
  });

  it('should drop errored plugins from pending', () => {
    const error = new Error('load failed');

    const frame0 = fullPipe(makeFrame());

    const frame1 = Composer.set(
      ['core', 'plugin_installer', 'pending'],
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
