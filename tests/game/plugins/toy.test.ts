import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
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
  Effects.pipe,
  Events.pipe,
  Scheduler.pipe,
  moduleManagerPipe
);

type Emitted = { type: string; payload?: unknown };

const getEffects = (frame: GameFrame): Emitted[] =>
  (frame?.core?.effects?.queue ?? []).filter((e: Emitted) =>
    e.type.startsWith(TOY_ID)
  );

function collect(
  frame: GameFrame,
  ticks: number,
  step = 16
): { frame: GameFrame; effects: Emitted[] } {
  const effects: Emitted[] = [];
  for (let i = 0; i < ticks; i++) {
    frame = gamePipe(tick(frame, step));
    effects.push(...getEffects(frame));
  }
  return { frame, effects };
}

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
    const frame = enterPhase(unpauseAndWait(bootstrap()), GamePhase.climax);

    expect(getToyScheduled(frame).length).toBeGreaterThan(0);
  });

  it('should keep stepping the ramp as it fires', () => {
    let frame = enterPhase(unpauseAndWait(bootstrap()), GamePhase.climax);

    expect(getToyScheduled(frame)[0]?.id).toBeDefined();

    for (let i = 0; i < 12; i++) {
      frame = gamePipe(tick(frame, CLIMAX_INTERVAL));
    }

    expect(reschedules(frame)).toBe(true);
  });

  it('should stop scheduling once the ramp is exhausted', () => {
    let frame = enterPhase(unpauseAndWait(bootstrap()), GamePhase.climax);

    for (let i = 0; i < CLIMAX_TICKS; i++) {
      frame = gamePipe(tick(frame, CLIMAX_INTERVAL));
    }

    expect(reschedules(frame)).toBe(false);
  });

  it('should cancel the ramp when entering a break', () => {
    let frame = enterPhase(unpauseAndWait(bootstrap()), GamePhase.climax);
    expect(getToyScheduled(frame).length).toBeGreaterThan(0);

    frame = enterPhase(frame, GamePhase.break);

    expect(getToyScheduled(frame)).toHaveLength(0);
  });

  it('should emit the ramp as falling vibration strengths ending in a stop', () => {
    const start = withImpulse(Phase.setPhase(GamePhase.climax))(
      tick(unpauseAndWait(bootstrap()))
    );
    const { effects } = collect(start, CLIMAX_TICKS, CLIMAX_INTERVAL);

    const strengths = effects
      .filter(e => e.type === `${TOY_ID}/vibration`)
      .map(e => (e.payload as { strength: number }).strength);

    expect(strengths).toHaveLength(15);
    expect(strengths[0]).toBe(1);
    expect(strengths.at(-1)).toBeCloseTo(1 - 14 * 0.067);
    for (let i = 1; i < strengths.length; i++) {
      expect(strengths[i]).toBeLessThan(strengths[i - 1]);
    }
    expect(effects.at(-1)?.type).toBe(`${TOY_ID}/stop`);
  });

  it('should emit a stop on entering a break', () => {
    const frame = enterPhase(bootstrap(), GamePhase.active);
    const start = withImpulse(Phase.setPhase(GamePhase.break))(tick(frame));

    const { effects } = collect(start, 3);

    expect(effects.map(e => e.type)).toContain(`${TOY_ID}/stop`);
  });

  it('should emit an actuate when the stroke flips while active', () => {
    let frame = unpauseAndWait(bootstrap());
    frame = enterPhase(frame, GamePhase.active);
    frame = withImpulse(
      Composer.pipe(
        Composer.set(
          ['core.toy', 'toys'],
          [{ name: 't', index: 0, actuators: [] }]
        ),
        Composer.set(['core.intensity', 'intensity'], 0.5),
        Composer.set(['core.pace', 'pace'], 2),
        Composer.set(['settings', 'maxPace'], 5),
        Composer.set(['core.stroke', 'stroke'], 'up')
      )
    )(tick(frame));

    const effects = [...getEffects(frame), ...collect(frame, 2).effects];
    const actuate = effects.find(e => e.type === `${TOY_ID}/actuate`);

    expect(actuate?.payload).toEqual({
      stroke: 'up',
      intensity: 50,
      pace: 2,
      maxPace: 5,
    });
  });

  it('should not actuate while paused, outside active, or without toys', () => {
    const withToys = Composer.set(
      ['core.toy', 'toys'],
      [{ name: 't', index: 0, actuators: [] }]
    );
    const flip = (dir: string) => Composer.set(['core.stroke', 'stroke'], dir);
    const actuates = (frame: GameFrame) =>
      [...getEffects(frame), ...collect(frame, 2).effects].filter(
        e => e.type === `${TOY_ID}/actuate`
      );

    const paused = withImpulse(Composer.pipe(withToys, flip('up')))(
      tick(enterPhase(bootstrap(), GamePhase.active))
    );
    expect(actuates(paused)).toEqual([]);

    const warmup = withImpulse(Composer.pipe(withToys, flip('down')))(
      tick(enterPhase(unpauseAndWait(bootstrap()), GamePhase.warmup))
    );
    expect(actuates(warmup)).toEqual([]);

    const noToys = withImpulse(flip('up'))(
      tick(enterPhase(unpauseAndWait(bootstrap()), GamePhase.active))
    );
    expect(actuates(noToys)).toEqual([]);
  });

  it('should not actuate on the same stroke twice', () => {
    let frame = unpauseAndWait(bootstrap());
    frame = enterPhase(frame, GamePhase.active);
    frame = withImpulse(
      Composer.pipe(
        Composer.set(
          ['core.toy', 'toys'],
          [{ name: 't', index: 0, actuators: [] }]
        ),
        Composer.set(['core.stroke', 'stroke'], 'up')
      )
    )(tick(frame));

    const effects = [...getEffects(frame), ...collect(frame, 6).effects];

    expect(effects.filter(e => e.type === `${TOY_ID}/actuate`)).toHaveLength(1);
  });

  it('should mark connecting and queue a connect effect', () => {
    const frame = Toy.connect('ws://127.0.0.1:12345')(bootstrap());

    expect(frame.core.toy.connecting).toBe(true);
    expect(frame.core.toy.error).toBeUndefined();
    expect(getEffects(frame)).toEqual([
      { type: `${TOY_ID}/connect`, payload: { url: 'ws://127.0.0.1:12345' } },
    ]);
  });

  it('should emit stop and disconnect while unloading', () => {
    const frame = bootstrap();
    const unloaded = gamePipe(tick(ModuleManager.unload(TOY_ID)(frame)));

    expect(getEffects(unloaded).map(e => e.type)).toEqual([
      `${TOY_ID}/stop`,
      `${TOY_ID}/disconnect`,
    ]);
    expect(unloaded.core.toy).toBeUndefined();
  });

  it('should hold ramp steps while paused', () => {
    let frame = enterPhase(unpauseAndWait(bootstrap()), GamePhase.climax);
    expect(getToyScheduled(frame).length).toBeGreaterThan(0);

    frame = withImpulse(Pause.setPaused(true))(tick(frame));
    frame = settle(frame);

    const duration = getToyScheduled(frame)[0]?.duration;
    for (let i = 0; i < 10; i++) {
      frame = gamePipe(tick(frame));
    }

    expect(getToyScheduled(frame)[0]?.duration).toBe(duration);
  });
});
