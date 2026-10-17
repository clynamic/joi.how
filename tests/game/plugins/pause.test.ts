import { describe, it, expect } from 'vitest';
import { Scheduler, ScheduledEvent } from '../../../src/engine/pipes/Scheduler';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Pause, { PauseState } from '../../../src/game/plugins/pause';
import { PLAY_TIMELINE } from '../../../src/game/timelines';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

const DEALER_ID = 'test.dealer';

function bootstrap(): GameFrame {
  let frame = gamePipe(makeFrame());
  frame = ModuleManager.load(Pause)(frame);
  frame = gamePipe(tick(frame));
  frame = gamePipe(tick(frame));
  return frame;
}

function getScheduled(frame: GameFrame): ScheduledEvent[] {
  return frame?.core?.scheduler?.scheduled ?? [];
}

function getRates(frame: GameFrame): Record<string, number> {
  return frame?.core?.scheduler?.rates ?? {};
}

function getPauseState(frame: GameFrame): PauseState | undefined {
  return frame?.core?.pause;
}

function getDealerScheduled(frame: GameFrame): ScheduledEvent[] {
  return getScheduled(frame).filter(s => s.id?.startsWith(DEALER_ID));
}

const playEntry = (duration: number): Pipe =>
  Scheduler.schedule({
    id: `${DEALER_ID}/schedule/check`,
    duration,
    timeline: PLAY_TIMELINE,
    event: { type: `${DEALER_ID}/roll.check` },
  });

function unpauseAndWait(frame: GameFrame): GameFrame {
  frame = withImpulse(Pause.setPaused(false))(tick(frame));
  for (let i = 0; i < 300; i++) {
    frame = gamePipe(tick(frame, 100));
  }
  return frame;
}

describe('Pause + Scheduler resume', () => {
  it('should start with the play timeline stopped', () => {
    const frame = bootstrap();

    expect(getPauseState(frame)?.paused).toBe(true);
    expect(getRates(frame)[PLAY_TIMELINE]).toBe(0);
  });

  it('should keep play entries frozen while paused from the start', () => {
    let frame = withImpulse(playEntry(1000))(tick(bootstrap()));
    frame = gamePipe(tick(frame));
    frame = gamePipe(tick(frame));

    expect(getDealerScheduled(frame)[0]?.duration).toBe(1000);
  });

  it('should keep engine entries moving while paused', () => {
    let frame = withImpulse(
      Scheduler.schedule({
        id: `${DEALER_ID}/schedule/engine`,
        duration: 1000,
        event: { type: `${DEALER_ID}/engine` },
      })
    )(tick(bootstrap()));
    frame = gamePipe(tick(frame));

    expect(getDealerScheduled(frame)[0]?.duration).toBeLessThan(1000);
  });

  it('should let play entries tick down once unpaused', () => {
    let frame = unpauseAndWait(bootstrap());

    frame = withImpulse(playEntry(1000))(tick(frame));
    const before = getDealerScheduled(frame)[0]?.duration;
    expect(before).toBeDefined();

    frame = gamePipe(tick(frame));

    expect(getRates(frame)[PLAY_TIMELINE]).toBe(1);
    expect(getDealerScheduled(frame)[0]?.duration).toBeLessThan(before!);
  });

  it('should freeze play entries when paused', () => {
    let frame = unpauseAndWait(bootstrap());

    frame = withImpulse(playEntry(1000))(tick(frame));
    frame = gamePipe(tick(frame));

    frame = withImpulse(Pause.setPaused(true))(tick(frame));
    for (let i = 0; i < 5; i++) {
      frame = gamePipe(tick(frame));
    }

    expect(getRates(frame)[PLAY_TIMELINE]).toBe(0);
    const durationAfterPause = getDealerScheduled(frame)[0]?.duration;

    for (let i = 0; i < 10; i++) {
      frame = gamePipe(tick(frame));
    }

    expect(getDealerScheduled(frame)[0]?.duration).toBe(durationAfterPause);
  });

  it('should resume play entries after the countdown', () => {
    let frame = unpauseAndWait(bootstrap());

    frame = withImpulse(playEntry(50000))(tick(frame));
    frame = gamePipe(tick(frame));

    frame = withImpulse(Pause.setPaused(true))(tick(frame));
    for (let i = 0; i < 5; i++) {
      frame = gamePipe(tick(frame));
    }

    const durationBeforeResume = getDealerScheduled(frame)[0]?.duration;

    frame = withImpulse(Pause.setPaused(false))(tick(frame));

    for (let i = 0; i < 300; i++) {
      frame = gamePipe(tick(frame, 100));
    }

    const dealerEvent = getDealerScheduled(frame)[0];
    const pauseState = getPauseState(frame);

    expect(pauseState?.paused).toBe(false);
    expect(getRates(frame)[PLAY_TIMELINE]).toBe(1);
    expect(dealerEvent?.duration).toBeLessThan(durationBeforeResume!);
  });

  it('should count down through pause state during resume', () => {
    let frame = bootstrap();

    frame = withImpulse(Pause.setPaused(true))(tick(frame));
    for (let i = 0; i < 5; i++) {
      frame = gamePipe(tick(frame));
    }

    frame = withImpulse(Pause.setPaused(false))(tick(frame));

    const seenCountdowns: number[] = [];

    for (let i = 0; i < 300; i++) {
      frame = gamePipe(tick(frame, 100));
      const countdown = getPauseState(frame)?.countdown;
      if (countdown != null && !seenCountdowns.includes(countdown)) {
        seenCountdowns.push(countdown);
      }
    }

    expect(seenCountdowns).toContain(3);
    expect(seenCountdowns).toContain(2);
    expect(seenCountdowns).toContain(1);
    expect(getPauseState(frame)?.paused).toBe(false);
    expect(getPauseState(frame)?.countdown).toBeNull();
  });

  it('should cancel resume countdown when re-paused', () => {
    let frame = bootstrap();

    frame = withImpulse(Pause.setPaused(true))(tick(frame));
    for (let i = 0; i < 5; i++) {
      frame = gamePipe(tick(frame));
    }

    frame = withImpulse(Pause.setPaused(false))(tick(frame));

    for (let i = 0; i < 10; i++) {
      frame = gamePipe(tick(frame, 100));
    }

    frame = withImpulse(Pause.setPaused(true))(tick(frame));
    for (let i = 0; i < 5; i++) {
      frame = gamePipe(tick(frame));
    }

    expect(getPauseState(frame)?.paused).toBe(true);

    for (let i = 0; i < 300; i++) {
      frame = gamePipe(tick(frame, 100));
    }

    expect(getPauseState(frame)?.paused).toBe(true);
    expect(getRates(frame)[PLAY_TIMELINE]).toBe(0);
  });

  it('should stop play entries where they are on unload', () => {
    let frame = unpauseAndWait(bootstrap());
    frame = withImpulse(playEntry(1000))(tick(frame));
    frame = gamePipe(tick(ModuleManager.unload(Pause.id)(frame)));
    for (let i = 0; i < 5; i++) frame = gamePipe(tick(frame));
    const held = getDealerScheduled(frame)[0]?.duration;
    frame = gamePipe(tick(frame));

    expect(getRates(frame)[PLAY_TIMELINE]).toBeUndefined();
    expect(held).toBeLessThan(1000);
    expect(getDealerScheduled(frame)[0]?.duration).toBe(held);
  });
});
