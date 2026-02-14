import type { GameFrame, GameContext, GameState } from '../src/engine/State';

export const makeFrame = (overrides?: {
  state?: GameState;
  context?: Partial<GameContext>;
}): GameFrame => ({
  state: overrides?.state ?? {},
  context: { tick: 0, step: 16, time: 0, ...overrides?.context },
});

export const tick = (frame: GameFrame, step = 16): GameFrame => ({
  ...frame,
  context: {
    ...frame.context,
    tick: frame.context.tick + 1,
    step,
    time: frame.context.time + step,
  },
});
