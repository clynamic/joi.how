import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame } from '../../../src/engine/State';
import Pace from '../../../src/game/plugins/pace';
import { makeFrame, makeGame, seed, tick } from '../../utils';

const { pipe: gamePipe } = makeGame();

function booted(values: Record<string, unknown>): GameFrame {
  let frame = seed(values)(gamePipe(makeFrame()));
  frame = ModuleManager.load(Pace)(frame);
  return gamePipe(tick(frame));
}

describe('Pace', () => {
  it('should keep its upper bound at or above the lower one', () => {
    expect(Pace.bounds(booted({ minPace: 2, maxPace: 5 }))).toEqual({
      min: 2,
      max: 5,
    });
    expect(Pace.bounds(booted({ minPace: 4, maxPace: 1 }))).toEqual({
      min: 4,
      max: 4,
    });
  });

  it('should keep a restored pace while the presets document lands', () => {
    let frame = gamePipe(makeFrame());
    frame = ModuleManager.load(Pace)(frame);
    frame = gamePipe(tick(frame));
    frame = Composer.set(['core', 'pace', 'pace'], 4)(frame);
    frame = gamePipe(tick(frame));
    expect(frame.core.pace.pace).toBe(4);

    frame = Composer.set(['core', 'presets'], {
      document: { 'core.pace': { minPace: 2, maxPace: 8 } },
      loaded: true,
    })(frame);
    frame = gamePipe(tick(frame));
    expect(frame.core.pace.pace).toBe(4);
  });

  it('should keep the pace within its bounds', () => {
    let frame = booted({ minPace: 2, maxPace: 5 });
    expect(frame.core.pace.pace).toBe(2);

    frame = Pace.keys.set('minPace', 3)(frame);
    frame = gamePipe(tick(frame));
    expect(frame.core.pace.pace).toBe(3);

    frame = Composer.set(['core', 'pace', 'pace'], 9)(frame);
    frame = gamePipe(tick(frame));
    expect(frame.core.pace.pace).toBe(5);
  });
});
