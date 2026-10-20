import 'fake-indexeddb/auto';
import { describe, it, expect, vi } from 'vitest';
import Bytes from '../../../src/game/plugins/bytes';
import { sdk } from '../../../src/engine/sdk';
import { Effects } from '../../../src/engine/pipes/Effects';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import Storage from '../../../src/engine/plugins/Storage';
import PluginInstaller from '../../../src/engine/plugins/PluginInstaller';
import { Composer } from '../../../src/engine/Composer';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { definePlugin } from '../../../src/engine/plugins/Plugins';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

const blob = (text: string) => new Blob([text], { type: 'text/plain' });

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

const injected: Pipe[] = [];

async function step(
  frame: GameFrame,
  impulse: Pipe = f => f
): Promise<GameFrame> {
  Effects.flush(frame, pipe => injected.push(pipe));
  await settle();
  return withImpulse(Composer.pipe(...injected.splice(0), impulse))(
    tick(frame)
  );
}

async function bootWithMods(installed: string[]): Promise<GameFrame> {
  localStorage.setItem(
    'core.plugin_installer.index',
    JSON.stringify({ installed, disabled: [], meta: {} })
  );
  let frame = gamePipe(makeFrame());
  for (const plugin of [Storage, Bytes, PluginInstaller]) {
    frame = ModuleManager.load(plugin)(frame);
  }
  frame = gamePipe(tick(frame));
  for (let i = 0; i < 6; i++) frame = await step(frame);
  return frame;
}

const allKeys = async () =>
  [
    ...(await Bytes.for('sweep.mod').keys()).map(k => `sweep.mod/${k}`),
    ...(await Bytes.for('sweep.gone').keys()).map(k => `sweep.gone/${k}`),
    ...(await Bytes.for('sweep.inbuilt').keys()).map(k => `sweep.inbuilt/${k}`),
  ].sort();

describe('Bytes', () => {
  it('should offer the byte store to mods', async () => {
    await sdk.Bytes.for('me.mod').put('track', blob('mod file'));

    expect(await sdk.Bytes.for('me.mod').keys()).toEqual(['track']);
  });

  it('should clear the files under a prefix and keep the rest', async () => {
    const files = Bytes.for('me.clear');
    await files.put('gone/a', blob('a'));
    await files.put('gone/b', blob('b'));
    await files.put('kept/c', blob('c'));
    let frame = ModuleManager.load(Bytes)(gamePipe(makeFrame()));
    frame = withImpulse(files.clear('gone/'))(tick(gamePipe(tick(frame))));

    Effects.flush(frame, () => undefined);

    await vi.waitFor(async () => expect(await files.keys('gone/')).toEqual([]));
    expect(await files.keys()).toEqual(['kept/c']);
  });

  it('should sweep the files of plugins that are gone', async () => {
    localStorage.clear();
    definePlugin({ id: 'sweep.inbuilt' });
    await Bytes.for('sweep.mod').put('a', blob('a'));
    await Bytes.for('sweep.gone').put('b', blob('b'));
    await Bytes.for('sweep.inbuilt').put('c', blob('c'));

    let frame = await bootWithMods(['sweep.mod']);
    await vi.waitFor(async () =>
      expect(await allKeys()).toEqual(['sweep.inbuilt/c', 'sweep.mod/a'])
    );

    frame = await step(frame, PluginInstaller.remove('sweep.mod'));
    for (let i = 0; i < 4; i++) frame = await step(frame);
    await vi.waitFor(async () =>
      expect(await allKeys()).toEqual(['sweep.inbuilt/c'])
    );
  });
});
