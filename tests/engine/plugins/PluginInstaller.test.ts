import { describe, it, expect, beforeEach } from 'vitest';
import PluginInstaller from '../../../src/engine/plugins/PluginInstaller';
import {
  ModuleManager,
  moduleManagerPipe,
} from '../../../src/engine/modules/ModuleManager';
import { Events } from '../../../src/engine/pipes/Events';
import { Composer } from '../../../src/engine/Composer';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { makeFrame, tick } from '../../utils';

const PLUGIN_NAMESPACE = 'core.plugin_installer';

const fullPipe: Pipe = Composer.pipe(Events.pipe, moduleManagerPipe);

const getInstalledIds = (frame: GameFrame): string[] =>
  frame?.core?.plugin_installer?.installed ?? [];

const getDisabledIds = (frame: GameFrame): string[] =>
  frame?.core?.plugin_installer?.disabled ?? [];

const getFailedIds = (frame: GameFrame): string[] =>
  frame?.core?.plugin_installer?.failed ?? [];

const getMeta = (frame: GameFrame): Record<string, any> =>
  frame?.core?.plugin_installer?.meta ?? {};

function bootstrap(): GameFrame {
  const frame0 = fullPipe(makeFrame());
  const frame1 = ModuleManager.load(PluginInstaller)(frame0);
  return fullPipe(tick(frame1));
}

describe('Plugin Installer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty state', () => {
    const frame = bootstrap();

    expect(getInstalledIds(frame)).toEqual([]);
    expect(getDisabledIds(frame)).toEqual([]);
    expect(getFailedIds(frame)).toEqual([]);
    expect(getMeta(frame)).toEqual({});
  });

  it('should load installed ids from storage on activate', () => {
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.installed`,
      JSON.stringify(['user.test'])
    );
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.code/user.test`,
      JSON.stringify('export default { id: "user.test" }')
    );

    const frame = bootstrap();
    expect(getInstalledIds(frame)).toEqual(['user.test']);
  });

  it('should load disabled ids from storage on activate', () => {
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.disabled`,
      JSON.stringify(['user.disabled'])
    );

    const frame = bootstrap();
    expect(getDisabledIds(frame)).toEqual(['user.disabled']);
  });

  it('should load meta from storage on activate', () => {
    const meta = { 'user.test': { name: 'Test', version: '1.0' } };
    localStorage.setItem(`${PLUGIN_NAMESPACE}.meta`, JSON.stringify(meta));

    const frame = bootstrap();
    expect(getMeta(frame)).toEqual(meta);
  });

  it('should mark plugins with no code as failed', () => {
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.installed`,
      JSON.stringify(['user.nocode'])
    );

    const frame = bootstrap();
    expect(getFailedIds(frame)).toContain('user.nocode');
  });

  it('should skip disabled plugins during activation', () => {
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.installed`,
      JSON.stringify(['user.test'])
    );
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.disabled`,
      JSON.stringify(['user.test'])
    );
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.code/user.test`,
      JSON.stringify('export default { id: "user.test" }')
    );

    const frame = bootstrap();
    expect(getInstalledIds(frame)).toEqual(['user.test']);
    expect(getDisabledIds(frame)).toEqual(['user.test']);
    expect(getFailedIds(frame)).toEqual([]);
  });

  it('should remove plugin from storage and state', () => {
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.installed`,
      JSON.stringify(['user.remove'])
    );
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.code/user.remove`,
      JSON.stringify('export default { id: "user.remove" }')
    );
    const meta = { 'user.remove': { name: 'Remove Me' } };
    localStorage.setItem(`${PLUGIN_NAMESPACE}.meta`, JSON.stringify(meta));

    let frame = bootstrap();
    expect(getInstalledIds(frame)).toContain('user.remove');

    frame = PluginInstaller.remove('user.remove')(frame);
    frame = fullPipe(tick(frame));

    expect(getInstalledIds(frame)).not.toContain('user.remove');
    expect(getMeta(frame)).not.toHaveProperty('user.remove');
    expect(
      localStorage.getItem(`${PLUGIN_NAMESPACE}.code/user.remove`)
    ).toBeNull();

    const storedInstalled = JSON.parse(
      localStorage.getItem(`${PLUGIN_NAMESPACE}.installed`) ?? '[]'
    );
    expect(storedInstalled).not.toContain('user.remove');
  });

  it('should add to disabled array on disable', () => {
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.installed`,
      JSON.stringify(['user.dis'])
    );
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.code/user.dis`,
      JSON.stringify('export default { id: "user.dis" }')
    );

    let frame = bootstrap();
    expect(getDisabledIds(frame)).not.toContain('user.dis');

    frame = PluginInstaller.disable('user.dis')(frame);
    frame = fullPipe(tick(frame));

    expect(getDisabledIds(frame)).toContain('user.dis');

    const storedDisabled = JSON.parse(
      localStorage.getItem(`${PLUGIN_NAMESPACE}.disabled`) ?? '[]'
    );
    expect(storedDisabled).toContain('user.dis');
  });

  it('should remove from disabled array on enable', () => {
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.installed`,
      JSON.stringify(['user.en'])
    );
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.disabled`,
      JSON.stringify(['user.en'])
    );
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.code/user.en`,
      JSON.stringify('export default { id: "user.en" }')
    );

    let frame = bootstrap();
    expect(getDisabledIds(frame)).toContain('user.en');

    frame = PluginInstaller.enable('user.en')(frame);
    frame = fullPipe(tick(frame));

    expect(getDisabledIds(frame)).not.toContain('user.en');

    const storedDisabled = JSON.parse(
      localStorage.getItem(`${PLUGIN_NAMESPACE}.disabled`) ?? '[]'
    );
    expect(storedDisabled).not.toContain('user.en');
  });

  it('should not duplicate disabled entries', () => {
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.installed`,
      JSON.stringify(['user.dup'])
    );
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.code/user.dup`,
      JSON.stringify('export default { id: "user.dup" }')
    );

    let frame = bootstrap();

    frame = PluginInstaller.disable('user.dup')(frame);
    frame = fullPipe(tick(frame));
    frame = PluginInstaller.disable('user.dup')(frame);
    frame = fullPipe(tick(frame));

    expect(
      getDisabledIds(frame).filter(id => id === 'user.dup')
    ).toHaveLength(1);
  });

  it('should clean up disabled on remove', () => {
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.installed`,
      JSON.stringify(['user.cr'])
    );
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.disabled`,
      JSON.stringify(['user.cr'])
    );
    localStorage.setItem(
      `${PLUGIN_NAMESPACE}.code/user.cr`,
      JSON.stringify('export default { id: "user.cr" }')
    );

    let frame = bootstrap();

    frame = PluginInstaller.remove('user.cr')(frame);
    frame = fullPipe(tick(frame));

    expect(getDisabledIds(frame)).not.toContain('user.cr');
    expect(getInstalledIds(frame)).not.toContain('user.cr');
  });
});
