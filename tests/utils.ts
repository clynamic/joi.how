import type { GameFrame, Pipe } from '../src/engine/State';
import { Composer } from '../src/engine/Composer';
import { Impulses } from '../src/engine/Impulses';
import { moduleManagerPipe } from '../src/engine/modules/ModuleManager';
import { gamePipes } from '../src/game/pipes/Game';

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

export const makeGame = (plugins: Pipe[] = [moduleManagerPipe]) => {
  const impulses = new Impulses();
  const pipe: Pipe = Composer.pipe(...gamePipes(impulses, plugins));
  const withImpulse =
    (impulse: Pipe): Pipe =>
    frame => {
      impulses.push(impulse);
      return pipe(frame);
    };
  return { pipe, withImpulse, impulses };
};
