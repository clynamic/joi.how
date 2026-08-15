import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Events } from '../../../src/engine/pipes/Events';
import { Scheduler, ScheduledEvent } from '../../../src/engine/pipes/Scheduler';
import {
  ModuleManager,
  moduleManagerPipe,
} from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Pause from '../../../src/game/plugins/pause';
import Phase, { GamePhase } from '../../../src/game/plugins/phase';
import Toy from '../../../src/game/plugins/toy';
import { makeFrame, tick } from '../../utils';

const gamePipe: Pipe = Composer.pipe(
  Events.pipe,
  Scheduler.pipe,
  moduleManagerPipe
);

const withImpulse = (impulse: Pipe): Pipe => Composer.pipe(impulse, gamePipe);

const TOY_ID = 'core.toy';
const CLIMAX_INTERVAL = 400;
const CLIMAX_TICKS = 60;
const SETTLE_TICKS = 6;

function bootstrap(): GameFrame {
  let frame = gamePipe(makeFrame());
  frame = ModuleManager.load(Pause)(frame);
  frame = ModuleManager.load(Phase)(frame);
  frame = ModuleManager.load(Toy)(frame);
  frame = gamePipe(tick(frame));
  frame = gamePipe(tick(frame));
  return frame;
}

function getToyScheduled(frame: GameFrame): ScheduledEvent[] {
  const scheduled: ScheduledEvent[] = frame?.core?.scheduler?.scheduled ?? [];
  return scheduled.filter(s => s.id?.startsWith(TOY_ID));
}

function settle(frame: GameFrame, count = 3): GameFrame {
  for (let i = 0; i < count; i++) {
    frame = gamePipe(tick(frame));
  }
  return frame;
}

function enterPhase(frame: GameFrame, phase: GamePhase): GameFrame {
  return settle(withImpulse(Phase.setPhase(phase))(tick(frame)));
}

function reschedules(frame: GameFrame): boolean {
  for (let i = 0; i < SETTLE_TICKS; i++) {
    if (getToyScheduled(frame).length > 0) return true;
    frame = gamePipe(tick(frame, CLIMAX_INTERVAL));
  }
  return getToyScheduled(frame).length > 0;
}

function unpauseAndWait(frame: GameFrame): GameFrame {
  frame = withImpulse(Pause.setPaused(false))(tick(frame));
  for (let i = 0; i < 300; i++) {
    frame = gamePipe(tick(frame, 100));
  }
  return frame;
}

describe('Toy', () => {
  it('should start with no devices', () => {
    const frame = bootstrap();

    expect(frame?.core?.toy?.toys).toEqual([]);
    expect(frame?.core?.toy?.connection).toBeUndefined();
  });

  it('should schedule a climax ramp step on entering climax', () => {
    const frame = enterPhase(bootstrap(), GamePhase.climax);

    expect(getToyScheduled(frame).length).toBeGreaterThan(0);
  });

  it('should keep stepping the ramp as it fires', () => {
    let frame = enterPhase(bootstrap(), GamePhase.climax);

    expect(getToyScheduled(frame)[0]?.id).toBeDefined();

    for (let i = 0; i < 12; i++) {
      frame = gamePipe(tick(frame, CLIMAX_INTERVAL));
    }

    expect(reschedules(frame)).toBe(true);
  });

  it('should stop scheduling once the ramp is exhausted', () => {
    let frame = enterPhase(bootstrap(), GamePhase.climax);

    for (let i = 0; i < CLIMAX_TICKS; i++) {
      frame = gamePipe(tick(frame, CLIMAX_INTERVAL));
    }

    expect(reschedules(frame)).toBe(false);
  });

  it('should cancel the ramp when entering a break', () => {
    let frame = enterPhase(bootstrap(), GamePhase.climax);
    expect(getToyScheduled(frame).length).toBeGreaterThan(0);

    frame = enterPhase(frame, GamePhase.break);

    expect(getToyScheduled(frame)).toHaveLength(0);
  });

  it('should hold ramp steps while paused', () => {
    let frame = enterPhase(unpauseAndWait(bootstrap()), GamePhase.climax);
    expect(getToyScheduled(frame).length).toBeGreaterThan(0);

    frame = withImpulse(Pause.setPaused(true))(tick(frame));
    frame = settle(frame);

    const held = getToyScheduled(frame)[0];
    expect(held?.held).toBe(true);

    const duration = held?.duration;
    for (let i = 0; i < 10; i++) {
      frame = gamePipe(tick(frame));
    }

    expect(getToyScheduled(frame)[0]?.duration).toBe(duration);
  });
});
