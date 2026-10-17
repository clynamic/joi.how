import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Rand from '../../../src/game/plugins/rand';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe } = makeGame();

const draw: Pipe = Composer.do(({ take, over }) => {
  const value = take(Rand.next);
  over(['seen'], (list: number[]) => [...list, value], []);
});

function drawn(seed: string): number[] {
  let frame = gamePipe(makeFrame());
  frame = gamePipe(tick(ModuleManager.load(Rand)(frame)));
  frame = Composer.pipe(Rand.seed(seed), draw, draw, draw)(frame);
  return (frame as GameFrame).seen;
}

describe('Rand', () => {
  it('should draw the same sequence for the same seed and another for a different one', () => {
    expect(drawn('alpha')).toEqual(drawn('alpha'));
    expect(drawn('alpha')).not.toEqual(drawn('beta'));
  });

  it('should keep drawing from a cursor that collapsed to zero', () => {
    let frame = gamePipe(makeFrame());
    frame = gamePipe(tick(ModuleManager.load(Rand)(frame)));
    frame = Composer.set(Rand.paths.cursor, 0)(frame);
    frame = Composer.pipe(draw, draw, draw)(frame);
    const values: number[] = (frame as GameFrame).seen;

    expect(new Set(values).size).toBe(3);
    expect(values.every(v => v > 0 && v < 1)).toBe(true);
  });

  it('should keep drawing after a seed that hashes to zero', () => {
    const values = drawn('');

    expect(new Set(values).size).toBe(3);
    expect(values.every(v => v > 0 && v < 1)).toBe(true);
  });
});
