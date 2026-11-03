import type { GameFrame, Pipe } from '../src/engine/State';
import { Composer } from '../src/engine/Composer';
import { Impulses } from '../src/engine/Impulses';
import { moduleManagerPipe } from '../src/engine/modules/ModuleManager';
import { gamePipes } from '../src/game';
import Pace from '../src/game/classic/pace';
import { intensityKeys } from '../src/game/classic/intensity';
import { warmupKeys } from '../src/game/classic/warmup';
import { dealerKeys } from '../src/game/classic/dice';
import { climaxKeys } from '../src/game/classic/dice/climax';
import { hypnoKeys } from '../src/game/classic/hypno';
import { imageKeys } from '../src/game/classic/randomImages';
import { playerKeys } from '../src/game/player';
import { displayKeys } from '../src/game/classic/image';
import ClassicImages from '../src/game/classic/images';
import Home from '../src/game/home';

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

const declared = [
  Pace.keys,
  intensityKeys,
  warmupKeys,
  dealerKeys,
  climaxKeys,
  hypnoKeys,
  imageKeys,
  playerKeys,
  displayKeys,
  ClassicImages.keys,
  Home.keys,
];

export const defaults = Object.assign(
  {},
  ...declared.map(keys => keys.defaults)
) as {
  [K in keyof (typeof declared)[number]['defaults']]: unknown;
} & Record<string, unknown>;

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
    Composer.set(['how.joi.presets'], { document, loaded: true }),
    Composer.set(['how.joi.settings'], { document, loaded: true })
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
