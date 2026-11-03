import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame } from '../../../src/engine/State';
import EmergencyStop from '../../../src/game/classic/emergencyStop';
import Messages from '../../../src/game/messages';
import Pace from '../../../src/game/classic/pace';
import Pause from '../../../src/game/pause';
import Phase, { GamePhase } from '../../../src/game/phase';
import { defaults, makeFrame, makeGame, seed, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

function bootstrap(): GameFrame {
  let frame = gamePipe(makeFrame());
  frame = Composer.pipe(
    seed({ ...defaults, minPace: 1, maxPace: 5 }),
    Composer.set(['how.joi.classic.intensity'], { intensity: 0.5 })
  )(frame);
  for (const plugin of [Pause, Phase, Pace, Messages, EmergencyStop]) {
    frame = ModuleManager.load(plugin)(frame);
  }
  frame = gamePipe(tick(frame));
  frame = gamePipe(tick(frame));
  frame = withImpulse(Pause.setPaused(false))(tick(frame));
  for (let i = 0; i < 60; i++) frame = gamePipe(tick(frame, 100));
  frame = withImpulse(Pace.setPace(4))(tick(frame, 1));
  return withImpulse(Phase.setPhase(GamePhase.active))(tick(frame, 1));
}

function run(frame: GameFrame, ms: number, step = 100): GameFrame {
  for (let t = 0; t < ms; t += step) frame = gamePipe(tick(frame, step));
  return frame;
}

describe('EmergencyStop', () => {
  it('should break, calm intensity and drop to min pace on trigger', () => {
    let frame = bootstrap();
    frame = withImpulse(EmergencyStop.trigger())(tick(frame, 1));
    frame = gamePipe(tick(frame, 1));

    expect(frame.how.joi.phase.current).toBe(GamePhase.break);
    expect(frame.how.joi.classic.intensity.intensity).toBeCloseTo(0.2);
    expect(frame.how.joi.classic.pace.pace).toBe(1);
    expect(
      frame.how.joi.messages.messages.map((m: { title: string }) => m.title)
    ).toContain('Calm down with your $hands off.');
  });

  it('should count down every second and return to active', () => {
    let frame = bootstrap();
    frame = withImpulse(EmergencyStop.trigger())(tick(frame, 1));
    frame = gamePipe(tick(frame, 1));

    const descriptions = new Set<string>();
    const titles = new Set<string>();
    let elapsed = 0;
    while (
      frame.how.joi.phase.current !== GamePhase.active &&
      elapsed < 90000
    ) {
      frame = gamePipe(tick(frame, 100));
      elapsed += 100;
      for (const m of frame.how.joi.messages.messages as {
        title: string;
        description?: string;
      }[]) {
        titles.add(m.title);
        if (m.description) descriptions.add(m.description);
      }
    }

    const counts = [...descriptions].filter(d => /^\d+\.\.\.$/.test(d));
    expect(counts).toHaveLength(35);
    expect(counts).toContain('35...');
    expect(counts).toContain('1...');
    expect(titles).toContain('Put your $hands back.');
    expect(frame.how.joi.phase.current).toBe(GamePhase.active);
    expect(elapsed).toBeGreaterThanOrEqual(42000);
  });

  it('should apply a double trigger once', () => {
    let frame = bootstrap();
    frame = withImpulse(
      Composer.pipe(EmergencyStop.trigger(), EmergencyStop.trigger())
    )(tick(frame, 1));
    frame = gamePipe(tick(frame, 1));

    expect(frame.how.joi.classic.intensity.intensity).toBeCloseTo(0.2);
  });

  it('should ignore a trigger outside the active phase', () => {
    let frame = withImpulse(Phase.setPhase(GamePhase.warmup))(
      tick(bootstrap(), 1)
    );
    frame = withImpulse(EmergencyStop.trigger())(tick(frame, 1));
    frame = gamePipe(tick(frame, 1));

    expect(frame.how.joi.phase.current).toBe(GamePhase.warmup);
    expect(frame.how.joi.classic.intensity.intensity).toBe(0.5);
  });

  it('should hold the calm down while paused', () => {
    let frame = bootstrap();
    frame = withImpulse(EmergencyStop.trigger())(tick(frame, 1));
    frame = gamePipe(tick(frame, 1));
    frame = withImpulse(Pause.setPaused(true))(tick(frame, 1));

    frame = run(frame, 60000);

    expect(frame.how.joi.phase.current).toBe(GamePhase.break);
  });
});
