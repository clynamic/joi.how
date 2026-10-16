import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { Events } from '../../../src/engine/pipes/Events';
import { Scheduler } from '../../../src/engine/pipes/Scheduler';
import {
  ModuleManager,
  moduleManagerPipe,
} from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Messages from '../../../src/game/plugins/messages';
import { makeFrame, tick } from '../../utils';

const gamePipe: Pipe = Composer.pipe(
  Effects.pipe,
  Events.pipe,
  Scheduler.pipe,
  moduleManagerPipe
);

const titles = (frame: GameFrame): string[] =>
  (frame.core.messages?.messages ?? []).map((m: { title: string }) => m.title);

function bootstrap(): GameFrame {
  const frame = gamePipe(makeFrame());
  return gamePipe(tick(ModuleManager.load(Messages)(frame)));
}

function step(frame: GameFrame, impulse: Pipe = f => f, ms = 16): GameFrame {
  return Composer.pipe(impulse, gamePipe)(tick(frame, ms));
}

function run(frame: GameFrame, ms: number, stepMs = 100): GameFrame {
  for (let t = 0; t < ms; t += stepMs) frame = step(frame, f => f, stepMs);
  return frame;
}

describe('Messages', () => {
  it('should show a sent message and merge updates into it', () => {
    let frame = step(bootstrap(), Messages.send({ id: 'a', title: 'Hello' }));
    frame = step(frame, Messages.send({ id: 'a', description: 'there' }));

    expect(frame.core.messages.messages).toEqual([
      { id: 'a', title: 'Hello', description: 'there' },
    ]);
  });

  it('should refuse to create a message without a title', () => {
    const frame = step(
      bootstrap(),
      Messages.send({ id: 'a', description: 'x' })
    );

    expect(titles(frame)).toEqual([]);
  });

  it('should expire a message after its duration', () => {
    let frame = step(
      bootstrap(),
      Messages.send({ id: 'a', title: 'Brief', duration: 1000 })
    );
    frame = run(frame, 700);
    expect(titles(frame)).toEqual(['Brief']);

    frame = run(frame, 600);
    expect(titles(frame)).toEqual([]);
  });

  it('should keep a message that was updated just before its old expiry', () => {
    let frame = step(
      bootstrap(),
      Messages.send({ id: 'a', title: 'First', duration: 1000 })
    );
    frame = run(frame, 1000);
    frame = step(
      frame,
      Messages.send({ id: 'a', title: 'Second', duration: 2000 })
    );
    frame = run(frame, 1500);

    expect(titles(frame)).toEqual(['Second']);

    frame = run(frame, 1000);
    expect(titles(frame)).toEqual([]);
  });

  it('should cancel the expiry when an update drops the duration', () => {
    let frame = step(
      bootstrap(),
      Messages.send({ id: 'a', title: 'Timed', duration: 500 })
    );
    frame = step(frame, Messages.send({ id: 'a', duration: undefined }));
    frame = step(frame);

    const pending = (frame.core.scheduler.scheduled ?? []).filter(
      (s: { id?: string }) => s.id === 'core.messages/schedule/message/a'
    );
    expect(pending).toEqual([]);
    expect(titles(run(frame, 2000))).toEqual(['Timed']);
  });
});
