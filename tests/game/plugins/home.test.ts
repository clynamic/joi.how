import { describe, it, expect, beforeEach } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Storage from '../../../src/engine/plugins/Storage';
import Scene from '../../../src/game/plugins/scene';
import Settings from '../../../src/game/plugins/settings';
import Presets from '../../../src/game/plugins/presets';
import Home from '../../../src/game/plugins/home';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

function step(frame: GameFrame, impulse: Pipe = f => f): GameFrame {
  const injected: Pipe[] = [];
  Effects.flush(frame, pipe => injected.push(pipe));
  return withImpulse(Composer.pipe(...injected, impulse))(tick(frame));
}

function boot(): GameFrame {
  let frame = gamePipe(makeFrame());
  for (const plugin of [Storage, Scene, Settings, Presets, Home]) {
    frame = ModuleManager.load(plugin)(frame);
  }
  return gamePipe(tick(frame));
}

describe('Home', () => {
  beforeEach(() => localStorage.clear());

  it('should hold the boot scene until both stores have loaded, then enter home', () => {
    let frame = boot();
    const scenes: string[] = [];
    for (let i = 0; i < 8; i++) {
      frame = step(frame);
      scenes.push(frame.how.joi.scene.current);
    }

    expect(scenes[0]).toBe('boot');
    expect(scenes[scenes.length - 1]).toBe('home');
    const entered = scenes.indexOf('home');
    const loadedAt = scenes.findIndex((_, i) => i >= 0);
    expect(entered).toBeGreaterThan(loadedAt);
  });

  it('should stay in boot while a store has not loaded', () => {
    let frame = boot();
    frame = Composer.set(['how.joi.presets', 'loaded'], false)(frame);
    for (let i = 0; i < 3; i++) {
      frame = withImpulse(Composer.set(['how.joi.presets', 'loaded'], false))(
        tick(frame)
      );
    }

    expect(frame.how.joi.scene.current).toBe('boot');
  });
});
