import type { GameFrame } from '../src/engine/State';

export const makeFrame = (overrides?: Partial<GameFrame>): GameFrame => ({
  tick: 0,
  step: 16,
  time: 0,
  ...overrides,
});

export const tick = (frame: GameFrame, step = 16): GameFrame => ({
  ...frame,
  tick: frame.tick + 1,
  step,
  time: frame.time + step,
});
