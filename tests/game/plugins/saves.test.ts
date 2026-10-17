import { describe, it, expect, beforeEach } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { Module } from '../../../src/engine/modules/Module';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { Scheduler } from '../../../src/engine/pipes/Scheduler';
import Pause from '../../../src/game/plugins/pause';
import Saves, { SaveFile } from '../../../src/game/plugins/saves';
import Rand from '../../../src/game/plugins/rand';
import Intensity from '../../../src/game/plugins/intensity';
import Phase, { GamePhase } from '../../../src/game/plugins/phase';
import Pace from '../../../src/game/plugins/pace';
import Clock from '../../../src/game/plugins/clock';
import Stroke from '../../../src/game/plugins/stroke';
import Messages from '../../../src/game/plugins/messages';
import Warmup from '../../../src/game/plugins/warmup';
import { defaultSettings } from '../../../src/settings/Settings';
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
    Saves.onLoad<{ n: number }>(id, data => Composer.set([id], data ?? { n }))
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

  it('should hand each plugin its own blob on load and start plugins without one fresh', () => {
    store('one', { 'test.a': { n: 9 } });
    let frame = bootstrap(Saves, a, b);
    frame = Composer.set(['test.b'], { n: 5 })(frame);

    frame = withImpulse(Saves.load('one'))(tick(frame));
    frame = flush(frame);
    frame = gamePipe(tick(frame));

    expect(frame.test.a).toEqual({ n: 9 });
    expect(frame.test.b).toEqual({ n: 2 });
  });

  it('should start every plugin fresh on reset without touching storage', () => {
    store('auto', { 'test.a': { n: 9 } });
    let frame = bootstrap(Saves, a, b);
    frame = Composer.set(['test.b'], { n: 5 })(frame);

    frame = withImpulse(Saves.reset())(tick(frame));
    flush(frame);

    expect(frame.test.a).toEqual({ n: 1 });
    expect(frame.test.b).toEqual({ n: 2 });
    expect(stored('auto')?.blobs).toEqual({ 'test.a': { n: 9 } });
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

  it('should resume the game plugins and their timers from a slot', () => {
    const plugins = [
      Pause,
      Saves,
      Rand,
      Intensity,
      Phase,
      Pace,
      Clock,
      Stroke,
      Messages,
      Warmup,
    ];
    const playing = (): GameFrame => {
      let frame = gamePipe(makeFrame());
      frame = Composer.set(['settings'], {
        ...defaultSettings,
        warmupDuration: 30,
      })(frame);
      frame = Composer.pipe(...plugins.map(ModuleManager.load))(frame);
      frame = gamePipe(tick(frame));
      frame = flush(frame);
      frame = Composer.set(Pause.paths.paused, false)(frame);
      return until(
        frame,
        f => Scheduler.remaining(f, 'core.warmup') !== undefined,
        { step: 100 }
      );
    };

    let frame = playing();
    frame = Composer.pipe(
      Composer.set(['core.rand'], { seed: 'saved', cursor: 42 }),
      Composer.set(Intensity.paths.intensity, 0.5),
      Pace.setPace(3),
      Phase.setPhase(GamePhase.active)
    )(frame);
    frame = Composer.set(Clock.paths.elapsed, 1234)(frame);
    for (let i = 0; i < 5; i++) frame = gamePipe(tick(frame, 100));
    frame = withImpulse(Saves.save('one'))(tick(frame));
    flush(frame);
    const file = stored('one')!.blobs as Record<string, any>;

    let fresh = playing();
    fresh = Composer.set(Pause.paths.paused, true)(fresh);
    fresh = until(fresh, f => f.core.scheduler.rates.play === 0);
    fresh = withImpulse(Saves.load('one'))(tick(fresh));
    fresh = flush(fresh);
    fresh = gamePipe(tick(fresh));

    expect(file['core.warmup'].timers[0].duration).toBeLessThan(30000);
    expect(fresh.core.rand).toEqual({ seed: 'saved', cursor: 42 });
    expect(fresh.core.intensity.intensity).toBe(
      file['core.intensity'].intensity
    );
    expect(fresh.core.intensity.intensity).toBeGreaterThan(0.5);
    expect(fresh.core.pace.pace).toBe(3);
    expect(fresh.core.phase.current).toBe(GamePhase.active);
    expect(fresh.core.clock).toEqual({
      elapsed: file['core.clock'].elapsed,
      lastWall: null,
    });
    expect(fresh.core.clock.elapsed).toBeGreaterThan(1234);
    expect(fresh.core.stroke).toEqual(file['core.stroke']);
    expect(Scheduler.snapshot(fresh, 'core.warmup')).toEqual(
      file['core.warmup'].timers
    );
  });

  it('should autosave every ten seconds of play and not while paused', () => {
    let frame = bootstrap(Pause, Saves, a);
    const persisted = (f: GameFrame) =>
      queue(f).some(e => e.type === `${SAVES_ID}/persist`);
    frame = Composer.set(['test.a'], { n: 3 })(frame);
    for (let i = 0; i < 15; i++) {
      frame = gamePipe(tick(frame, 1000));
      flush(frame);
    }
    const whilePaused = stored('auto');

    frame = Composer.set(Pause.paths.paused, false)(frame);
    frame = until(frame, f => f.core.scheduler.rates.play === 1);
    frame = until(frame, persisted, { step: 1000, maxTicks: 12 });
    flush(frame);
    const first = stored('auto');
    frame = Composer.set(['test.a'], { n: 4 })(frame);
    frame = until(frame, persisted, { step: 1000, maxTicks: 12 });
    flush(frame);

    expect(whilePaused).toBeNull();
    expect(first?.blobs).toEqual({ 'test.a': { n: 3 } });
    expect(stored('auto')?.blobs).toEqual({ 'test.a': { n: 4 } });
  });

  it('should drop a slot', () => {
    store('one', { 'test.a': { n: 9 } });
    const frame = withImpulse(Saves.drop('one'))(tick(bootstrap(Saves)));

    flush(frame);

    expect(stored('one')).toBeNull();
  });
});
