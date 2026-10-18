import type { GameFrame, Pipe } from '../src/engine/State';
import { Composer } from '../src/engine/Composer';
import { Impulses } from '../src/engine/Impulses';
import { moduleManagerPipe } from '../src/engine/modules/ModuleManager';
import { gamePipes } from '../src/game/pipes/Game';
import Pace from '../src/game/plugins/pace';
import { intensityKeys } from '../src/game/plugins/intensity';
import { warmupKeys } from '../src/game/plugins/warmup';

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

const declared = [Pace.keys, intensityKeys, warmupKeys];

const sectioned = (values: Record<string, unknown>) =>
  Object.fromEntries(
    declared.map(keys => [
      keys.plugin,
      Object.fromEntries(
        Object.keys(keys.defaults)
          .filter(key => key in values)
          .map(key => [key, values[key]])
      ),
    ])
  );

export const seed = (values: object): Pipe => {
  const document = sectioned(values as Record<string, unknown>);
  return Composer.pipe(
    Composer.set(['settings'], values),
    Composer.set(['core', 'presets'], { document, loaded: true }),
    Composer.set(['core', 'settings'], { document, loaded: true })
  );
};

export const makeGame = (plugins: Pipe[] = [moduleManagerPipe]) => {
  const impulses = new Impulses();
  const pipe: Pipe = Composer.pipe(...gamePipes(impulses, plugins));
  const withImpulse =
    (impulse: Pipe): Pipe =>
    frame => {
      impulses.push(impulse);
      return pipe(frame);
    };
  const until = (
    frame: GameFrame,
    predicate: (frame: GameFrame) => boolean,
    { maxTicks = 100, step = 16 } = {}
  ): GameFrame => {
    if (predicate(frame)) return frame;
    for (let i = 0; i < maxTicks; i++) {
      frame = pipe(tick(frame, step));
      if (predicate(frame)) return frame;
    }
    throw new Error(`condition not met within ${maxTicks} ticks`);
  };
  return { pipe, withImpulse, impulses, until };
};
