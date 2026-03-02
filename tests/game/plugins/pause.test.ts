import { describe, it, expect, beforeEach } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Events } from '../../../src/engine/pipes/Events';
import { Scheduler, ScheduledEvent } from '../../../src/engine/pipes/Scheduler';
import {
  pluginManagerPipe,
  PluginManager,
} from '../../../src/engine/plugins/PluginManager';
import { moduleManagerPipe } from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { PluginClass } from '../../../src/engine/plugins/Plugins';
import Pause, { PauseState } from '../../../src/game/plugins/pause';
import { makeFrame, tick } from '../../utils';

const gamePipe: Pipe = Composer.pipe(
  Events.pipe,
  Scheduler.pipe,
  moduleManagerPipe,
  pluginManagerPipe
);

const withImpulse = (impulse: Pipe): Pipe => Composer.pipe(impulse, gamePipe);

const makePluginClass = (plugin: {
  id: string;
  [k: string]: any;
}): PluginClass => ({
  plugin,
  name: plugin.id,
});

const DEALER_ID = 'test.dealer';

function bootstrap(): GameFrame {
  const dealerPlugin = {
    id: DEALER_ID,
    update: Composer.pipe(
      Pause.onPause(() => Scheduler.holdByPrefix(DEALER_ID)),
      Pause.onResume(() => Scheduler.releaseByPrefix(DEALER_ID))
    ),
  };

  let frame = gamePipe(makeFrame());
  frame = PluginManager.register(makePluginClass(Pause.plugin))(frame);
  frame = PluginManager.register(makePluginClass(dealerPlugin))(frame);
  frame = gamePipe(tick(frame));
  frame = gamePipe(tick(frame));
  return frame;
}

function getScheduled(frame: GameFrame): ScheduledEvent[] {
  return frame?.core?.scheduler?.scheduled ?? [];
}

function getPauseState(frame: GameFrame): PauseState | undefined {
  return frame?.core?.pause;
}

function getDealerScheduled(frame: GameFrame): ScheduledEvent[] {
  return getScheduled(frame).filter(s => s.id?.startsWith(DEALER_ID));
}

function unpauseAndWait(frame: GameFrame): GameFrame {
  frame = withImpulse(Pause.setPaused(false))(tick(frame));
  for (let i = 0; i < 300; i++) {
    frame = gamePipe(tick(frame, 100));
  }
  return frame;
}

describe('Pause + Scheduler resume', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should schedule an event and have it tick down', () => {
    let frame = bootstrap();

    frame = withImpulse(
      Scheduler.schedule({
        id: `${DEALER_ID}/schedule/check`,
        duration: 1000,
        event: { type: `${DEALER_ID}/roll.check` },
      })
    )(tick(frame));

    const before = getScheduled(frame).find(s =>
      s.id?.includes('check')
    )?.duration;
    expect(before).toBeDefined();

    frame = gamePipe(tick(frame));
    const after = getScheduled(frame).find(s =>
      s.id?.includes('check')
    )?.duration;

    expect(after).toBeLessThan(before!);
  });

  it('should hold dealer events when paused', () => {
    let frame = unpauseAndWait(bootstrap());

    frame = withImpulse(
      Scheduler.schedule({
        id: `${DEALER_ID}/schedule/check`,
        duration: 1000,
        event: { type: `${DEALER_ID}/roll.check` },
      })
    )(tick(frame));
    frame = gamePipe(tick(frame));

    frame = withImpulse(Pause.setPaused(true))(tick(frame));

    for (let i = 0; i < 5; i++) {
      frame = gamePipe(tick(frame));
    }

    const dealerEvent = getDealerScheduled(frame)[0];
    expect(dealerEvent?.held).toBe(true);

    const durationAfterHold = dealerEvent?.duration;

    for (let i = 0; i < 10; i++) {
      frame = gamePipe(tick(frame));
    }

    expect(getDealerScheduled(frame)[0]?.duration).toBe(durationAfterHold);
  });

  it('should release dealer events after resume countdown', () => {
    let frame = unpauseAndWait(bootstrap());

    frame = withImpulse(
      Scheduler.schedule({
        id: `${DEALER_ID}/schedule/check`,
        duration: 50000,
        event: { type: `${DEALER_ID}/roll.check` },
      })
    )(tick(frame));
    frame = gamePipe(tick(frame));

    frame = withImpulse(Pause.setPaused(true))(tick(frame));
    for (let i = 0; i < 5; i++) {
      frame = gamePipe(tick(frame));
    }
    expect(getDealerScheduled(frame)[0]?.held).toBe(true);

    const durationBeforeResume = getDealerScheduled(frame)[0]?.duration;

    frame = withImpulse(Pause.setPaused(false))(tick(frame));

    for (let i = 0; i < 300; i++) {
      frame = gamePipe(tick(frame, 100));
    }

    const dealerEvent = getDealerScheduled(frame)[0];
    const pauseState = getPauseState(frame);

    expect(pauseState?.paused).toBe(false);
    expect(dealerEvent?.held).toBe(false);
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
  });
});
