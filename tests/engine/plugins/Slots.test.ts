import { describe, it, expect, beforeEach } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { pluginPaths } from '../../../src/engine/plugins/Plugins';
import Storage from '../../../src/engine/plugins/Storage';
import { Slots, SlotsState } from '../../../src/engine/plugins/Slots';
import pkg from '../../../package.json';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

const KIND = 'test.kind';
const paths = pluginPaths<SlotsState>(KIND);
const kind = Slots.define(KIND, paths);

const seen = (frame: GameFrame): unknown[] => frame.seen ?? [];
const record = (label: unknown): Pipe =>
  Composer.over(['seen'], (list: unknown[]) => [...list, label], []);

const watcher = {
  id: 'test.watch',
  activate: kind.activate,
  update: Composer.pipe(
    kind.update,
    kind.onRead((slot, file) =>
      record({ slot, data: file?.data ?? null, meta: file?.meta ?? null })
    )
  ),
  deactivate: kind.deactivate,
};

const state = (frame: GameFrame): SlotsState => frame.test.kind;

const warned = (frame: GameFrame, data: Record<string, unknown>) =>
  (frame.core.effects.queue as { type: string; payload: unknown }[]).some(
    e =>
      e.type === 'core.log/line' &&
      expect
        .objectContaining({ level: 'warn', data })
        .asymmetricMatch(e.payload)
  );

function flush(frame: GameFrame): GameFrame {
  const injected: Pipe[] = [];
  Effects.flush(frame, pipe => injected.push(pipe));
  return withImpulse(Composer.pipe(...injected))(tick(frame));
}

function settle(frame: GameFrame, times = 2): GameFrame {
  for (let i = 0; i < times; i++) frame = flush(frame);
  return frame;
}

function bootstrap(): GameFrame {
  let frame = gamePipe(makeFrame());
  frame = ModuleManager.load(Storage)(frame);
  frame = ModuleManager.load(watcher)(frame);
  frame = gamePipe(tick(frame));
  return settle(frame);
}

describe('Slots', () => {
  beforeEach(() => localStorage.clear());

  it('should list written slots newest first', () => {
    let frame = withImpulse(kind.write('a', { n: 1 }, { label: 'A' }, 100))(
      tick(bootstrap())
    );
    frame = settle(frame);
    frame = withImpulse(kind.write('b', { n: 2 }, undefined, 200))(tick(frame));
    frame = settle(frame);

    expect(JSON.parse(localStorage.getItem('test.kind.a')!)).toEqual({
      version: pkg.version,
      savedAt: 100,
      meta: { label: 'A' },
      data: { n: 1 },
    });
    expect(state(frame).slots).toEqual([
      { slot: 'b', version: pkg.version, savedAt: 200 },
      { slot: 'a', version: pkg.version, savedAt: 100, meta: { label: 'A' } },
    ]);
  });

  it('should hand a read to the kind', () => {
    localStorage.setItem(
      'test.kind.old',
      JSON.stringify({ version: pkg.version, savedAt: 1, blobs: { n: 9 } })
    );
    let frame = withImpulse(kind.write('a', { n: 1 }, { label: 'A' }, 100))(
      tick(bootstrap())
    );
    frame = settle(frame);
    frame = withImpulse(Composer.pipe(kind.read('a'), kind.read('old')))(
      tick(frame)
    );
    frame = settle(frame);

    expect(seen(frame)).toEqual([
      { slot: 'a', data: { n: 1 }, meta: { label: 'A' } },
      { slot: 'old', data: { n: 9 }, meta: null },
    ]);
  });

  it('should answer a refused file as missing and keep it aside', () => {
    localStorage.setItem(
      'test.kind.future',
      JSON.stringify({ version: '99.0.0', savedAt: 1, data: { n: 1 } })
    );
    localStorage.setItem('test.kind.junk', JSON.stringify({ hello: 1 }));
    let frame = withImpulse(
      Composer.pipe(kind.read('future'), kind.read('junk'))
    )(tick(bootstrap()));
    frame = flush(frame);

    expect(warned(frame, { slot: 'future', version: '99.0.0' })).toBe(true);
    expect(warned(frame, { slot: 'junk' })).toBe(true);
    frame = settle(frame);

    expect(seen(frame)).toEqual([
      { slot: 'future', data: null, meta: null },
      { slot: 'junk', data: null, meta: null },
    ]);
    expect(localStorage.getItem('test.kind.future')).toBeNull();
    expect(localStorage.getItem('test.kind.junk')).toBeNull();
    expect(
      JSON.parse(localStorage.getItem('test.kind.future~99.0.0')!)
    ).toMatchObject({ version: '99.0.0' });
    expect(
      JSON.parse(localStorage.getItem('test.kind.junk~unreadable')!)
    ).toEqual({ hello: 1 });
  });

  it('should report a missing slot to the kind as null', () => {
    let frame = withImpulse(kind.read('nothing'))(tick(bootstrap()));
    frame = settle(frame);

    expect(seen(frame)).toEqual([{ slot: 'nothing', data: null, meta: null }]);
  });

  it('should read the current slot at activate and on select', () => {
    const cpaths = pluginPaths<SlotsState>('test.current');
    const ckind = Slots.define('test.current', cpaths, { current: 'default' });
    const cwatcher = {
      id: 'test.cwatch',
      activate: ckind.activate,
      update: Composer.pipe(
        ckind.update,
        ckind.onRead((slot, file) => record({ slot, data: file?.data ?? null }))
      ),
      deactivate: ckind.deactivate,
    };
    localStorage.setItem(
      'test.current.b',
      JSON.stringify({ version: pkg.version, savedAt: 1, data: { n: 2 } })
    );
    let frame = gamePipe(makeFrame());
    frame = ModuleManager.load(Storage)(frame);
    frame = ModuleManager.load(cwatcher)(frame);
    frame = settle(gamePipe(tick(frame)), 3);

    expect(frame.test.current.current).toBe('default');
    expect(seen(frame)).toEqual([{ slot: 'default', data: null }]);

    frame = withImpulse(ckind.select('b'))(tick(frame));
    frame = settle(frame);

    expect(frame.test.current.current).toBe('b');
    expect(seen(frame)).toEqual([
      { slot: 'default', data: null },
      { slot: 'b', data: { n: 2 } },
    ]);
  });

  it('should drop a slot and keep the listing current', () => {
    let frame = withImpulse(
      Composer.pipe(
        kind.write('a', 1, undefined, 1),
        kind.write('b', 2, undefined, 2)
      )
    )(tick(bootstrap()));
    frame = settle(frame);
    frame = withImpulse(kind.drop('b'))(tick(frame));
    frame = settle(frame);

    expect(state(frame).slots.map(s => s.slot)).toEqual(['a']);
    expect(localStorage.getItem('test.kind.b')).toBeNull();
  });

  it('should remember the selected slot across an activate', () => {
    let frame = withImpulse(kind.select('b'))(tick(bootstrap()));
    frame = settle(frame);
    expect(state(frame).current).toBe('b');

    frame = withImpulse(ModuleManager.unload(watcher.id))(tick(frame));
    frame = settle(frame);
    frame = withImpulse(ModuleManager.load(watcher))(tick(frame));
    frame = settle(frame);

    expect(state(frame).current).toBe('b');
  });

  it('should find the slots under a prefix', () => {
    let frame = withImpulse(
      Composer.pipe(
        kind.write('vn/1', 1, undefined, 1),
        kind.write('vn/2', 2, undefined, 2),
        kind.write('x', 3, undefined, 3)
      )
    )(tick(bootstrap()));
    frame = settle(frame);

    expect(kind.find(frame, 'vn/').map(s => s.slot)).toEqual(['vn/2', 'vn/1']);
  });
});
