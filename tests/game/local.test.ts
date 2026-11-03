import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/game/local/resize', () => ({
  LowResImageSize: { thumbnail: 'thumbnail', preview: 'preview' },
  generateLowResImage: vi.fn(async () => {
    throw new Error('no canvas');
  }),
}));

import { Composer } from '../../src/engine/Composer';
import { Effects } from '../../src/engine/pipes/Effects';
import { Requests } from '../../src/engine/pipes/Requests';
import { ModuleManager } from '../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../src/engine/State';
import Storage from '../../src/engine/plugins/Storage';
import Assets from '../../src/game/assets';
import Local, { localImageService } from '../../src/game/local';
import { ImageType } from '../../src/game/assets';
import { makeFrame, makeGame, tick } from '../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function () {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}

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

async function boot(): Promise<GameFrame> {
  let frame = gamePipe(makeFrame());
  for (const plugin of [Storage, Assets, Local]) {
    frame = ModuleManager.load(plugin)(frame);
  }
  frame = gamePipe(tick(frame));
  for (let i = 0; i < 20; i++) {
    frame = await step(frame);
    if (i >= 3 && Requests.pending(frame).length === 0) break;
  }
  return frame;
}

const picture = (name: string) => ({
  blob: new Blob([name], { type: 'image/png' }),
  type: ImageType.image,
  name,
});

describe('Local', () => {
  beforeEach(() => {
    localStorage.clear();
    URL.createObjectURL = vi.fn(() => 'blob:stored');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('should import files into records a holder can keep and resolve', async () => {
    const [item] = await Local.import([picture('one.png')]);
    expect(item.record).toMatchObject({ kind: 'image', name: 'one.png' });

    let frame = await step(
      await boot(),
      Composer.pipe(
        Assets.keep('how.joi.local', item.id, item.record, 'classic'),
        Assets.use([`how.joi.local:${item.id}`])
      )
    );
    frame = await step(frame, Assets.load(`how.joi.local:${item.id}`, 'full'));
    frame = await step(frame);
    frame = await step(frame);

    expect(Assets.entry(frame, `how.joi.local:${item.id}`)).toMatchObject({
      state: 'loaded',
      urls: { full: 'blob:stored' },
    });
  });

  it('should free the urls of an image that leaves use', async () => {
    const [item] = await Local.import([picture('shown.png')]);
    const key = `how.joi.local:${item.id}`;
    let frame = await step(
      await boot(),
      Composer.pipe(
        Assets.keep('how.joi.local', item.id, item.record, 'classic'),
        Assets.use([key])
      )
    );
    frame = await step(frame, Assets.load(key, 'full'));
    frame = await step(frame);
    frame = await step(frame);
    expect(Assets.entry(frame, key)?.state).toBe('loaded');
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    frame = await step(frame, Assets.unuse([key]));
    await step(frame);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:stored');
  });

  it('should forget a kept record whose file is gone at startup', async () => {
    const [item] = await Local.import([picture('gone.png')]);
    const frame = await step(
      await boot(),
      Assets.keep('how.joi.local', item.id, item.record, 'classic')
    );
    await step(frame);
    await localImageService.removeImage(item.id);

    const again = await boot();

    expect(
      again.how.joi.assets.library[`how.joi.local:${item.id}`]
    ).toBeUndefined();
    expect(localStorage.getItem(`how.joi.assets.local:${item.id}`)).toBeNull();
  });

  it('should drop the file when the last holder releases it', async () => {
    const [item] = await Local.import([picture('drop.png')]);
    let frame = await step(
      await boot(),
      Assets.keep('how.joi.local', item.id, item.record, 'classic')
    );
    frame = await step(
      frame,
      Assets.release(`how.joi.local:${item.id}`, 'classic')
    );
    await step(frame);
    await settle();

    expect(await localImageService.listIds()).not.toContain(item.id);
  });
});
