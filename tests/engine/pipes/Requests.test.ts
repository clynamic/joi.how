import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { Events } from '../../../src/engine/pipes/Events';
import { Requests } from '../../../src/engine/pipes/Requests';
import {
  ModuleManager,
  moduleManagerPipe,
} from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { makeFrame, tick } from '../../utils';

const tickWith = (...impulses: Pipe[]): Pipe =>
  Composer.pipe(
    Effects.pipe,
    ...impulses,
    Events.pipe,
    Requests.pipe,
    moduleManagerPipe
  );

const seen = (frame: GameFrame): unknown[] => frame.seen ?? [];
const record = (label: unknown): Pipe =>
  Composer.over(['seen'], (list: unknown[]) => [...list, label], []);

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

async function step(
  frame: GameFrame,
  impulse: Pipe = f => f
): Promise<GameFrame> {
  const injected: Pipe[] = [];
  Effects.flush(frame, pipe => injected.push(pipe));
  await settle();
  return tickWith(...injected, impulse)(tick(frame));
}

const fetchThing = Requests.define<{ name: string }, string>(
  'test.src',
  'fetch'
);

const source = {
  id: 'test.src',
  update: Composer.pipe(
    fetchThing.onDone((result, id) => record({ done: result, id })),
    fetchThing.onFailed((reason, id) => record({ failed: reason, id }))
  ),
  effects: [
    fetchThing.perform(async ({ name }) => {
      if (name === 'missing') throw new Error('not found');
      return `url:${name}`;
    }),
  ],
};

async function boot(): Promise<GameFrame> {
  const frame = tickWith(ModuleManager.load(source))(makeFrame());
  return step(frame);
}

describe('Requests', () => {
  it('should hand the performer result back under the request id', async () => {
    let frame = await step(await boot(), fetchThing.start({ name: 'cat' }));
    expect(Requests.pending(frame)).toEqual(['test.src/fetch#0']);

    frame = await step(frame);
    frame = await step(frame);

    expect(seen(frame)).toEqual([{ done: 'url:cat', id: 'test.src/fetch#0' }]);
    expect(Requests.pending(frame)).toEqual([]);
  });

  it('should report a rejection as failed with its reason', async () => {
    let frame = await step(await boot(), fetchThing.start({ name: 'missing' }));
    frame = await step(frame);
    frame = await step(frame);

    expect(seen(frame)).toEqual([
      { failed: 'Error: not found', id: 'test.src/fetch#0' },
    ]);
    expect(Requests.pending(frame)).toEqual([]);
  });

  it('should keep two requests of one type apart', async () => {
    let frame = await step(
      await boot(),
      Composer.pipe(
        fetchThing.start({ name: 'a' }),
        fetchThing.start({ name: 'b' })
      )
    );
    expect(Requests.pending(frame, fetchThing.type)).toHaveLength(2);
    frame = await step(frame);
    frame = await step(frame);

    expect(seen(frame)).toEqual([
      { done: 'url:a', id: 'test.src/fetch#0' },
      { done: 'url:b', id: 'test.src/fetch#1' },
    ]);
  });
});
