import { describe, it, expect, beforeEach } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Scene from '../../../src/game/plugins/scene';
import Mode from '../../../src/game/plugins/mode';
import Phase from '../../../src/game/plugins/phase';
import Pause from '../../../src/game/plugins/pause';
import Rand from '../../../src/game/plugins/rand';
import Messages from '../../../src/game/plugins/messages';
import Storage from '../../../src/engine/plugins/Storage';
import Saves from '../../../src/game/plugins/saves';
import Intensity from '../../../src/game/plugins/intensity';
import Classic from '../../../src/game/plugins/classic';
import { defaultSettings } from '../../../src/settings/Settings';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse, until } = makeGame();

const RUN = ['core.dice', 'core.intensity', 'core.warmup', 'core.cues'];

const loaded = (frame: GameFrame): string[] =>
  frame.core.modules.order.filter((id: string) => RUN.includes(id));

const autoSlot = () => localStorage.getItem('core.saves.auto');

function flush(frame: GameFrame): GameFrame {
  const injected: Pipe[] = [];
  Effects.flush(frame, pipe => injected.push(pipe));
  return withImpulse(Composer.pipe(...injected))(tick(frame));
}

function bootstrap(): GameFrame {
  let frame = gamePipe(makeFrame());
  frame = Composer.set(['settings'], defaultSettings)(frame);
  frame = Composer.set(['images'], [])(frame);
  for (const p of [
    Scene,
    Mode,
    Phase,
    Pause,
    Rand,
    Messages,
    Storage,
    Saves,
    Classic,
  ]) {
    frame = ModuleManager.load(p)(frame);
  }
  frame = gamePipe(tick(frame));
  frame = flush(frame);
  return until(frame, f => loaded(f).length === RUN.length);
}

function enter(frame: GameFrame, scene: string): GameFrame {
  frame = withImpulse(Scene.setScene(scene))(tick(frame));
  return gamePipe(tick(frame));
}

describe('Classic', () => {
  beforeEach(() => localStorage.clear());

  it('should register itself and load its run while classic is the mode', () => {
    const frame = bootstrap();

    expect(frame.core.mode.modes.classic).toEqual({
      id: 'classic',
      name: 'Classic',
    });
    expect(loaded(frame).sort()).toEqual([...RUN].sort());
  });

  it('should unload its run when the mode leaves and load it again on return', () => {
    let frame = bootstrap();
    frame = withImpulse(Mode.register({ id: 'other', name: 'Other' }))(
      tick(frame)
    );

    frame = withImpulse(Mode.setMode('other'))(tick(frame));
    frame = until(frame, f => loaded(f).length === 0);
    const gone = frame.core.intensity;

    frame = withImpulse(Mode.setMode('classic'))(tick(frame));
    frame = until(frame, f => loaded(f).length === RUN.length);

    expect(gone).toBeUndefined();
    expect(frame.core.intensity).toEqual({ intensity: 0 });
  });

  it('should start the next run fresh after the end screen', () => {
    let frame = enter(bootstrap(), 'game');
    frame = Composer.set(Intensity.paths.intensity, 0.7)(frame);
    frame = withImpulse(Saves.save('auto'))(tick(frame));
    frame = flush(frame);
    const savedBefore = autoSlot();

    frame = enter(frame, 'end');
    frame = enter(frame, 'home');
    for (let i = 0; i < 4; i++) frame = flush(frame);

    expect(savedBefore).not.toBeNull();
    expect(autoSlot()).toBeNull();
    expect(frame.core.intensity.intensity).toBe(0);
    expect(loaded(frame).sort()).toEqual([...RUN].sort());
  });

  it('should autosave with its mode when play stops', () => {
    let frame = bootstrap();
    frame = Composer.set(Pause.paths.paused, false)(frame);
    frame = until(frame, f => f.core.scheduler.rates.play === 1);
    frame = Composer.set(Intensity.paths.intensity, 0.3)(frame);

    frame = withImpulse(Pause.setPaused(true))(tick(frame));
    frame = until(frame, f =>
      (f.core.effects?.queue ?? []).some(
        (e: { type: string }) => e.type === 'core.storage/write'
      )
    );
    flush(frame);

    expect(JSON.parse(autoSlot()!)).toMatchObject({
      meta: { mode: 'classic' },
      blobs: { 'core.intensity': { intensity: 0.3 } },
    });
  });

  it('should autosave every ten seconds of play and not while paused', () => {
    const persisted = (f: GameFrame) =>
      (f.core.effects?.queue ?? []).some(
        (e: { type: string }) => e.type === 'core.storage/write'
      );
    let frame = bootstrap();
    for (let i = 0; i < 15; i++) {
      frame = gamePipe(tick(frame, 1000));
      flush(frame);
    }
    const whilePaused = autoSlot();

    frame = Composer.set(Pause.paths.paused, false)(frame);
    frame = until(frame, f => f.core.scheduler.rates.play === 1);
    frame = until(frame, persisted, { step: 1000, maxTicks: 12 });
    const first = frame.tick;
    flush(frame);
    frame = until(frame, persisted, { step: 1000, maxTicks: 12 });

    expect(whilePaused).toBeNull();
    expect(frame.tick - first).toBeGreaterThanOrEqual(10);
    expect(JSON.parse(autoSlot()!).meta).toEqual({ mode: 'classic' });
  });

  it('should keep a run alone when the end screen is not involved', () => {
    let frame = enter(bootstrap(), 'game');
    frame = Composer.set(Intensity.paths.intensity, 0.7)(frame);

    frame = enter(frame, 'home');
    for (let i = 0; i < 4; i++) frame = flush(frame);

    expect(frame.core.intensity.intensity).toBe(0.7);
  });
});
