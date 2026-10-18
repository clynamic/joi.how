import { describe, it, expect, vi, beforeEach } from 'vitest';

const fake = vi.hoisted(() => ({ getImages: vi.fn() }));
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
import Assets, { AssetRecord } from '../../../src/game/plugins/assets';
import Presets from '../../../src/game/plugins/presets';
import Settings from '../../../src/game/plugins/settings';
import E621 from '../../../src/game/plugins/e621';
import ClassicImages from '../../../src/game/plugins/classicImages';
import { ImageServiceType, ImageType } from '../../../src/types';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

const image: AssetRecord = { kind: 'image', sizes: ['thumbnail', 'full'] };

const dropped: string[] = [];
const fakeSource = {
  id: 'test.source',
  effects: [
    Assets.source('fake').resolve.perform(
      async ({ id, size }) => `${id}/${size}`
    ),
    Assets.source('fake').drop.perform(({ id }) => {
      dropped.push(id);
    }),
  ],
};

const post = {
  id: '77',
  service: ImageServiceType.e621,
  source: 'https://e621.net/posts/77',
  thumbnail: 'https://cdn/t.jpg',
  preview: 'https://cdn/p.jpg',
  full: 'https://cdn/f.png',
  type: ImageType.image,
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
  for (const plugin of [
    Storage,
    Settings,
    Presets,
    Assets,
    E621,
    fakeSource,
    ClassicImages,
  ]) {
    frame = ModuleManager.load(plugin)(frame);
  }
  frame = gamePipe(tick(frame));
  for (let i = 0; i < 6; i++) frame = await step(frame);
  return frame;
}

const selection = (frame: GameFrame) => ClassicImages.keys.get(frame).images;
const library = (frame: GameFrame) => frame.core.assets.library;
const inUse = (frame: GameFrame) => Object.keys(frame.core.assets.inUse);

describe('Classic images', () => {
  beforeEach(() => {
    localStorage.clear();
    dropped.length = 0;
  });

  it('should keep added images for classic, select them and bring them into use', async () => {
    let frame = await step(
      await boot(),
      ClassicImages.add([{ source: 'fake', id: 'a', record: image }])
    );
    frame = await step(frame);
    frame = await step(frame);

    expect(selection(frame)).toEqual(['fake:a']);
    expect(library(frame)['fake:a'].holders).toEqual(['core.classic_images']);
    expect(inUse(frame)).toEqual(['fake:a']);
  });

  it('should release removed images and drop them when classic was the last holder', async () => {
    let frame = await step(
      await boot(),
      Composer.pipe(
        ClassicImages.add([{ source: 'fake', id: 'a', record: image }]),
        Assets.keep('fake', 'a', image, 'novel')
      )
    );
    frame = await step(frame);
    frame = await step(frame, ClassicImages.remove(['fake:a']));
    frame = await step(frame);
    frame = await step(frame);

    expect(selection(frame)).toEqual([]);
    expect(inUse(frame)).toEqual([]);
    expect(library(frame)['fake:a'].holders).toEqual(['novel']);
    expect(dropped).toEqual([]);
  });

  it("should add the results of its own e621 search and ignore another holder's", async () => {
    fake.getImages
      .mockResolvedValueOnce([post])
      .mockResolvedValueOnce([{ ...post, id: '78' }]);
    let frame = await step(
      await boot(),
      ClassicImages.searchE621({ tags: 'cat' })
    );
    for (let i = 0; i < 4; i++) frame = await step(frame);
    expect(selection(frame)).toEqual(['core.e621:77']);

    frame = await step(frame, E621.search({ tags: 'dog', holder: 'novel' }));
    for (let i = 0; i < 4; i++) frame = await step(frame);
    expect(selection(frame)).toEqual(['core.e621:77']);
  });

  it('should add the legacy image list to a selection that already exists', async () => {
    localStorage.setItem(
      'core.presets.default',
      JSON.stringify({
        version: '3.0.1',
        savedAt: 1,
        data: { 'core.classic_images': { images: ['fake:a'] } },
      })
    );
    localStorage.setItem('images', JSON.stringify([post]));
    const frame = await boot();

    expect(selection(frame)).toEqual(['fake:a', 'core.e621:77']);
  });

  it('should take the legacy image list as its selection once', async () => {
    localStorage.setItem('images', JSON.stringify([post]));
    const frame = await boot();

    expect(selection(frame)).toEqual(['core.e621:77']);
    expect(library(frame)['core.e621:77']).toMatchObject({
      holders: ['core.classic_images'],
    });
    expect(localStorage.getItem('images')).toBeNull();
  });
});
