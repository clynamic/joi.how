import { describe, it, expect, beforeEach } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { Module } from '../../../src/engine/modules/Module';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Pause from '../../../src/game/plugins/pause';
import Saves, { SaveFile } from '../../../src/game/plugins/saves';
import pkg from '../../../package.json';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse, until } = makeGame();

const SAVES_ID = 'core.saves';

type Queued = { type: string; payload?: any };
const queue = (frame: GameFrame): Queued[] => frame.core?.effects?.queue ?? [];

const stored = (slot: string): SaveFile | null =>
  JSON.parse(localStorage.getItem(`${SAVES_ID}.${slot}`) ?? 'null');

const store = (
  slot: string,
  blobs: Record<string, unknown>,
  version = pkg.version
) =>
  localStorage.setItem(
    `${SAVES_ID}.${slot}`,
    JSON.stringify({ version, savedAt: 1, blobs })
  );

const counter = (id: string, n: number): Module => ({
  id,
  activate: Composer.set([id], { n }),
  update: Composer.pipe(
    Saves.onSave(id, get => get([id])),
    Saves.onLoad<{ n: number }>(id, data => Composer.set([id], data))
  ),
  deactivate: Composer.set([id], undefined),
});

const a = counter('test.a', 1);
const b = counter('test.b', 2);

function flush(frame: GameFrame): GameFrame {
  const injected: Pipe[] = [];
  Effects.flush(frame, pipe => injected.push(pipe));
  return withImpulse(Composer.pipe(...injected))(tick(frame));
}

function bootstrap(...modules: Module[]): GameFrame {
  let frame = gamePipe(makeFrame());
  frame = Composer.pipe(...modules.map(ModuleManager.load))(frame);
  frame = gamePipe(tick(frame));
  frame = flush(frame);
  return gamePipe(tick(frame));
}

describe('Saves', () => {
  beforeEach(() => localStorage.clear());

  it('should collect each plugin blob under its id and persist them with the version', () => {
    let frame = bootstrap(Saves, a, b);

    frame = withImpulse(Saves.save('one'))(tick(frame));
    const persist = queue(frame).find(e => e.type === `${SAVES_ID}/persist`);
    flush(frame);

    expect(persist?.payload).toEqual({
      slot: 'one',
      blobs: { 'test.a': { n: 1 }, 'test.b': { n: 2 } },
    });
    expect(stored('one')).toMatchObject({
      version: pkg.version,
      blobs: { 'test.a': { n: 1 }, 'test.b': { n: 2 } },
    });
  });

  it('should hand each plugin its own blob on load and leave plugins without one alone', () => {
    store('one', { 'test.a': { n: 9 } });
    let frame = bootstrap(Saves, a, b);

    frame = withImpulse(Saves.load('one'))(tick(frame));
    frame = flush(frame);
    frame = gamePipe(tick(frame));

    expect(frame.test.a).toEqual({ n: 9 });
    expect(frame.test.b).toEqual({ n: 2 });
  });

  it('should ignore a save written by another version and say so', () => {
    store('one', { 'test.a': { n: 9 } }, '0.0.1');
    let frame = bootstrap(Saves, a);

    frame = withImpulse(Saves.load('one'))(tick(frame));
    frame = flush(frame);

    expect(frame.test.a).toEqual({ n: 1 });
    expect(queue(frame)).toContainEqual(
      expect.objectContaining({
        type: 'core.log/line',
        payload: expect.objectContaining({
          level: 'warn',
          message: 'ignored save {slot} from version {version}',
          data: { slot: 'one', version: '0.0.1' },
        }),
      })
    );
  });

  it('should restore the auto slot when it activates', () => {
    store('auto', { 'test.a': { n: 5 } });

    const frame = bootstrap(Saves, a);

    expect(frame.test.a).toEqual({ n: 5 });
  });

  it('should autosave to the auto slot when play stops', () => {
    let frame = bootstrap(Pause, Saves, a);
    frame = Composer.set(Pause.paths.paused, false)(frame);
    frame = until(frame, f => f.core.scheduler.rates.play === 1);
    frame = Composer.set(['test.a'], { n: 7 })(frame);

    frame = withImpulse(Pause.setPaused(true))(tick(frame));
    frame = until(frame, f =>
      queue(f).some(e => e.type === `${SAVES_ID}/persist`)
    );
    flush(frame);

    expect(stored('auto')?.blobs).toEqual({ 'test.a': { n: 7 } });
  });

  it('should drop a slot', () => {
    store('one', { 'test.a': { n: 9 } });
    const frame = withImpulse(Saves.drop('one'))(tick(bootstrap(Saves)));

    flush(frame);

    expect(stored('one')).toBeNull();
  });
});
