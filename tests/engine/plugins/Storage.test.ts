import { describe, it, expect, beforeEach } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Storage, { StoredEntry } from '../../../src/engine/plugins/Storage';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

const seen = (frame: GameFrame): unknown[] => frame.seen ?? [];
const record = (label: unknown): Pipe =>
  Composer.over(['seen'], (list: unknown[]) => [...list, label], []);

const watcher = {
  id: 'test.watch',
  update: Composer.pipe(
    Storage.onReadPrefix('t.', (value, key) => record({ key, value })),
    Storage.onRead('t.exact', value => record({ exact: value })),
    Storage.onList('t.', (entries: StoredEntry[]) => record(entries))
  ),
};

function flush(frame: GameFrame): GameFrame {
  const injected: Pipe[] = [];
  Effects.flush(frame, pipe => injected.push(pipe));
  return withImpulse(Composer.pipe(...injected))(tick(frame));
}

function bootstrap(): GameFrame {
  let frame = gamePipe(makeFrame());
  frame = ModuleManager.load(Storage)(frame);
  frame = ModuleManager.load(watcher)(frame);
  return gamePipe(tick(frame));
}

describe('Storage', () => {
  beforeEach(() => localStorage.clear());

  it('should write a value and read it back as data', () => {
    let frame = withImpulse(Storage.write('t.a', { n: 1 }))(tick(bootstrap()));
    flush(frame);

    frame = withImpulse(Storage.read('t.a'))(tick(frame));
    frame = flush(frame);

    expect(localStorage.getItem('t.a')).toBe('{"n":1}');
    expect(seen(frame)).toEqual([{ key: 't.a', value: { n: 1 } }]);
  });

  it('should read null for a missing key and after a remove', () => {
    let frame = withImpulse(Storage.write('t.gone', 1))(tick(bootstrap()));
    flush(frame);
    frame = withImpulse(Storage.remove('t.gone'))(tick(frame));
    flush(frame);

    frame = withImpulse(
      Composer.pipe(Storage.read('t.gone'), Storage.read('t.never'))
    )(tick(frame));
    frame = flush(frame);

    expect(seen(frame)).toEqual([
      { key: 't.gone', value: null },
      { key: 't.never', value: null },
    ]);
  });

  it('should list the entries under a prefix with their values', () => {
    localStorage.setItem('t.one', '{"n":1}');
    localStorage.setItem('t.two', '"two"');
    localStorage.setItem('u.other', '3');
    localStorage.setItem('t.broken', '{');

    let frame = withImpulse(Storage.list('t.'))(tick(bootstrap()));
    frame = flush(frame);

    const [entries] = seen(frame) as StoredEntry[][];
    expect(entries.sort((a, b) => a.key.localeCompare(b.key))).toEqual([
      { key: 't.one', value: { n: 1 } },
      { key: 't.two', value: 'two' },
    ]);
  });

  it('should hand a read to handlers of its exact key and of its prefix', () => {
    localStorage.setItem('u.other', '3');
    localStorage.setItem('t.exact', '1');
    localStorage.setItem('t.exactly', '2');
    let frame = withImpulse(
      Composer.pipe(
        Storage.read('u.other'),
        Storage.read('t.exact'),
        Storage.read('t.exactly')
      )
    )(tick(bootstrap()));
    frame = flush(frame);

    expect(seen(frame)).toEqual([
      { key: 't.exact', value: 1 },
      { key: 't.exactly', value: 2 },
      { exact: 1 },
    ]);
  });

  it('should say so when a stored value is not valid JSON', () => {
    localStorage.setItem('t.broken', '{');
    let frame = withImpulse(Storage.read('t.broken'))(tick(bootstrap()));
    frame = flush(frame);

    expect(seen(frame)).toEqual([{ key: 't.broken', value: null }]);
    expect(frame.core.effects.queue).toContainEqual(
      expect.objectContaining({
        type: 'core.log/line',
        payload: expect.objectContaining({
          level: 'warn',
          data: { key: 't.broken' },
        }),
      })
    );
  });
});
