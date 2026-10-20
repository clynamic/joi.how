import { describe, it, expect, beforeEach } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Storage from '../../../src/engine/plugins/Storage';
import Assets, { AssetRecord } from '../../../src/game/plugins/assets';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

const image: AssetRecord = { kind: 'image', sizes: ['thumbnail', 'full'] };

const dropped: string[] = [];
const freed: string[] = [];
const fakeSource = {
  id: 'test.source',
  effects: [
    Assets.source('fake').resolve.perform(async ({ id, size }) => {
      if (id === 'broken') throw new Error('no bytes');
      return `blob:${id}/${size}`;
    }),
    Assets.source('fake').drop.perform(({ id }) => {
      dropped.push(id);
    }),
    Assets.source('fake').free.perform(({ id }) => {
      freed.push(id);
    }),
  ],
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
  for (const plugin of [Storage, Assets, fakeSource]) {
    frame = ModuleManager.load(plugin)(frame);
  }
  frame = gamePipe(tick(frame));
  for (let i = 0; i < 3; i++) frame = await step(frame);
  return frame;
}

const library = (frame: GameFrame) => frame.core.assets.library;
const stored = (key: string) =>
  JSON.parse(localStorage.getItem(`core.assets.${key}`) ?? 'null');

describe('Assets', () => {
  beforeEach(() => {
    localStorage.clear();
    dropped.length = 0;
    freed.length = 0;
  });

  it('should keep a record for a holder and list it again at startup', async () => {
    let frame = await step(
      await boot(),
      Assets.keep('fake', 'a', image, 'classic')
    );
    frame = await step(frame);
    expect(library(frame)['fake:a']).toEqual({
      source: 'fake',
      id: 'a',
      record: image,
      holders: ['classic'],
    });
    expect(stored('fake:a')).toMatchObject({ holders: ['classic'] });

    const again = await boot();
    expect(library(again)['fake:a']).toMatchObject({ holders: ['classic'] });
  });

  it('should drop a record once its last holder releases it', async () => {
    let frame = await step(
      await boot(),
      Composer.pipe(
        Assets.keep('fake', 'a', image, 'classic'),
        Assets.keep('fake', 'a', image, 'novel')
      )
    );
    frame = await step(frame, Assets.release('fake:a', 'classic'));
    frame = await step(frame);
    expect(library(frame)['fake:a'].holders).toEqual(['novel']);
    expect(dropped).toEqual([]);

    frame = await step(frame, Assets.release('fake:a', 'novel'));
    frame = await step(frame);
    expect(library(frame)['fake:a']).toBeUndefined();
    expect(stored('fake:a')).toBeNull();
    expect(dropped).toEqual(['a']);
  });

  it('should release every hold of a holder and keep the holds of others', async () => {
    let frame = await step(
      await boot(),
      Composer.pipe(
        Assets.keep('fake', 'a', image, 'classic'),
        Assets.keep('fake', 'b', image, 'classic'),
        Assets.keep('fake', 'b', image, 'novel'),
        Assets.keep('fake', 'c', image, 'novel')
      )
    );

    frame = await step(frame, Assets.releaseAll('classic'));
    await step(frame);

    expect(library(frame)['fake:a']).toBeUndefined();
    expect(library(frame)['fake:b'].holders).toEqual(['novel']);
    expect(library(frame)['fake:c'].holders).toEqual(['novel']);
    expect(dropped).toEqual(['a']);
  });

  it('should resolve a used asset through its source and keep the url on the entry', async () => {
    let frame = await step(
      await boot(),
      Composer.pipe(
        Assets.keep('fake', 'a', image, 'classic'),
        Assets.use(['fake:a'])
      )
    );
    frame = await step(frame, Assets.load('fake:a', 'full'));
    expect(Assets.entry(frame, 'fake:a')?.state).toBe('loading');
    frame = await step(frame);
    frame = await step(frame);

    expect(Assets.entry(frame, 'fake:a')).toEqual({
      key: 'fake:a',
      state: 'loaded',
      urls: { full: 'blob:a/full' },
    });
  });

  it('should mark an asset failed with the reason when its source cannot resolve it', async () => {
    let frame = await step(
      await boot(),
      Composer.pipe(
        Assets.keep('fake', 'broken', image, 'classic'),
        Assets.use(['fake:broken'])
      )
    );
    frame = await step(frame, Assets.load('fake:broken', 'full'));
    frame = await step(frame);
    frame = await step(frame);

    expect(Assets.entry(frame, 'fake:broken')).toMatchObject({
      state: 'failed',
      reason: 'Error: no bytes',
    });
  });

  it('should resolve a load asked for before its record was listed', async () => {
    let frame = await step(
      await boot(),
      Composer.pipe(Assets.use(['fake:late']), Assets.load('fake:late', 'full'))
    );
    frame = await step(frame);
    expect(Assets.entry(frame, 'fake:late')?.state).toBe('listed');

    frame = await step(frame, Assets.keep('fake', 'late', image, 'classic'));
    frame = await step(frame);
    frame = await step(frame);

    expect(Assets.entry(frame, 'fake:late')).toMatchObject({
      state: 'loaded',
      urls: { full: 'blob:late/full' },
    });
  });

  it('should free the urls of an asset that leaves use', async () => {
    const keys = ['fake:a', 'fake:b', 'fake:c', 'fake:d'];
    let frame = await step(
      await boot(),
      Composer.pipe(
        ...['a', 'b', 'c', 'd'].map(id =>
          Assets.keep('fake', id, image, 'classic')
        ),
        Assets.use(keys)
      )
    );
    frame = await step(
      frame,
      Composer.pipe(...keys.map(key => Assets.load(key, 'full')))
    );
    frame = await step(frame);
    frame = await step(frame);
    expect(freed).toEqual([]);

    frame = await step(
      frame,
      Composer.pipe(
        Assets.unuse(['fake:a']),
        Assets.release('fake:b', 'classic'),
        Assets.forget('fake:c')
      )
    );
    await step(frame);

    expect(freed.sort()).toEqual(['a', 'b', 'c']);
  });

  it('should free a url that arrives after its asset left use', async () => {
    let frame = await step(
      await boot(),
      Composer.pipe(
        Assets.keep('fake', 'late', image, 'classic'),
        Assets.use(['fake:late'])
      )
    );
    frame = await step(frame, Assets.load('fake:late', 'full'));
    frame = await step(frame, Assets.unuse(['fake:late']));
    frame = await step(frame);
    await step(frame);

    expect(freed).toEqual(['late']);
  });

  it('should list a declared record without persisting it', async () => {
    let frame = await step(
      await boot(),
      Assets.declare('fake', 'sprite', { ...image, name: 'bg.cafe' })
    );
    frame = await step(frame);

    expect(
      Assets.find(frame, { source: 'fake', name: 'bg.cafe' })
    ).toHaveLength(1);
    expect(stored('fake:sprite')).toBeNull();
  });
});
