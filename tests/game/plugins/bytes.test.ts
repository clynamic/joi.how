import 'fake-indexeddb/auto';
import { describe, it, expect, vi } from 'vitest';
import Bytes from '../../../src/game/plugins/bytes';
import { sdk } from '../../../src/engine/sdk';
import { Effects } from '../../../src/engine/pipes/Effects';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

const blob = (text: string) => new Blob([text], { type: 'text/plain' });

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
});
