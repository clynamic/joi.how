import { describe, it, expect } from 'vitest';
import { Composer } from '../../src/engine/Composer';
import { ModuleManager } from '../../src/engine/modules/ModuleManager';
import { Scheduler } from '../../src/engine/pipes/Scheduler';
import { GameFrame, Pipe } from '../../src/engine/State';
import { Sequence } from '../../src/game/Sequence';
import Messages from '../../src/game/messages';
import Pause from '../../src/game/pause';
import { makeFrame, makeGame, tick } from '../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

const titles = (frame: GameFrame): string[] =>
  (frame.how.joi.messages?.messages ?? []).map(
    (m: { title: string }) => m.title
  );

function bootstrap(): GameFrame {
  const frame = gamePipe(makeFrame());
  const booted = Composer.pipe(
    Scheduler.setRate(Pause.timeline, 0),
    ModuleManager.load(Messages)
  );
  return gamePipe(tick(booted(frame)));
}

function step(frame: GameFrame, impulse: Pipe = f => f, ms = 16): GameFrame {
  return withImpulse(impulse)(tick(frame, ms));
}

function run(frame: GameFrame, ms: number, stepMs = 100): GameFrame {
  for (let t = 0; t < ms; t += stepMs) frame = step(frame, f => f, stepMs);
  return frame;
}

describe('Sequence', () => {
  it('should expire its messages on its own timeline', () => {
    const play = Sequence.for('test', 'play');
    const engine = Sequence.for('test', 'engine', {
      timeline: Scheduler.ENGINE_TIMELINE,
    });
    let frame = step(
      bootstrap(),
      Composer.pipe(
        play.message({ title: 'Waiting', duration: 1000 }),
        engine.message({ title: 'Ticking', duration: 1000 })
      )
    );
    frame = run(frame, 1300);

    expect(titles(frame)).toEqual(['Waiting']);
  });
});
