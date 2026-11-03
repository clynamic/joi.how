import { describe, it, expect, vi } from 'vitest';

const fake = vi.hoisted(() => ({
  getImages: vi.fn(),
}));

vi.mock('../../../src/services/e621', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../src/services/e621')>()),
  E621Service: class {
    getImages = fake.getImages;
  },
}));

import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Storage from '../../../src/engine/plugins/Storage';
import Assets from '../../../src/game/plugins/assets';
import E621, { E621Item } from '../../../src/game/plugins/e621';
import { ImageServiceType, ImageType } from '../../../src/types';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

const post = {
  id: '123',
  service: ImageServiceType.e621,
  source: 'https://e621.net/posts/123',
  thumbnail: 'https://cdn/thumb.jpg',
  preview: 'https://cdn/preview.jpg',
  full: 'https://cdn/full.png',
  type: ImageType.image,
};

const seen = (frame: GameFrame): unknown[] => frame.seen ?? [];
const record = (label: unknown): Pipe =>
  Composer.over(['seen'], (list: unknown[]) => [...list, label], []);

const watcher = {
  id: 'test.watch',
  update: Composer.pipe(
    E621.onResults((items: E621Item[], id) =>
      record({ ids: items.map(i => i.id), request: id })
    ),
    E621.onSearchFailed(reason => record({ failed: reason }))
  ),
};

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

async function step(
  frame: GameFrame,
  impulse: Pipe = f => f
): Promise<GameFrame> {
  const injected: Pipe[] = [];
  Effects.flush(frame, pipe => injected.push(pipe));
  await settle();
  return withImpulse(Composer.pipe(...injected, impulse))(tick(frame));
}

async function boot(): Promise<GameFrame> {
  let frame = gamePipe(makeFrame());
  for (const plugin of [Storage, Assets, E621, watcher]) {
    frame = ModuleManager.load(plugin)(frame);
  }
  frame = gamePipe(tick(frame));
  for (let i = 0; i < 3; i++) frame = await step(frame);
  return frame;
}

describe('e621', () => {
  it('should answer a search with records built from the posts', async () => {
    fake.getImages.mockResolvedValueOnce([post]);
    let frame = await step(
      await boot(),
      E621.search({ tags: 'cat', limit: 5 })
    );
    frame = await step(frame);
    frame = await step(frame);

    expect(fake.getImages).toHaveBeenCalledWith({
      tags: 'cat',
      limit: 5,
      score: undefined,
    });
    expect(seen(frame)).toEqual([
      { ids: ['123'], request: 'how.joi.e621/search#0' },
    ]);
  });

  it('should report a failed search with its reason', async () => {
    fake.getImages.mockRejectedValueOnce(new Error('offline'));
    let frame = await step(await boot(), E621.search({ tags: 'cat' }));
    frame = await step(frame);
    frame = await step(frame);

    expect(seen(frame)).toEqual([{ failed: 'Error: offline' }]);
  });

  it('should resolve a kept post to the url of the size asked for', async () => {
    const { e621Record } = await import('../../../src/game/plugins/e621');
    const rec = e621Record(post);
    let frame = await step(
      await boot(),
      Composer.pipe(
        Assets.keep('how.joi.e621', '123', rec, 'classic'),
        Assets.use(['how.joi.e621:123'])
      )
    );
    frame = await step(frame, Assets.load('how.joi.e621:123', 'preview'));
    frame = await step(frame);
    frame = await step(frame);

    expect(Assets.entry(frame, 'how.joi.e621:123')).toMatchObject({
      state: 'loaded',
      urls: { preview: 'https://cdn/preview.jpg' },
    });
  });
});
