import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Events } from '../../../src/engine/pipes/Events';
import { Scheduler } from '../../../src/engine/pipes/Scheduler';
import {
  ModuleManager,
  moduleManagerPipe,
} from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { typedPath } from '../../../src/engine/Lens';
import Mode from '../../../src/game/plugins/mode';
import Phase, { GamePhase } from '../../../src/game/plugins/phase';
import Pause from '../../../src/game/plugins/pause';
import Rand from '../../../src/game/plugins/rand';
import Dealer from '../../../src/game/plugins/dealer';
import { DiceEvent } from '../../../src/types';
import { OUTCOME_DONE } from '../../../src/game/plugins/dice/types';
import { defaultSettings } from '../../../src/settings/Settings';
import { makeFrame, tick } from '../../utils';

const gamePipe: Pipe = Composer.pipe(
  Events.pipe,
  Scheduler.pipe,
  moduleManagerPipe
);

const withImpulse = (impulse: Pipe): Pipe => Composer.pipe(impulse, gamePipe);

function startGame(intensityOverride = 0.5): GameFrame {
  let frame = gamePipe(makeFrame());

  frame = Composer.set(typedPath(['settings']), {
    ...defaultSettings,
    events: Object.values(DiceEvent),
  })(frame);
  frame = Composer.set(typedPath(['images']), [])(frame);
  frame = Composer.set(typedPath(['core.intensity']), {
    intensity: intensityOverride,
  })(frame);
  frame = Composer.set(typedPath(['core.pace']), {
    pace: 2,
    prevMinPace: 1,
    prevPace: 2,
    history: [],
  })(frame);
  frame = Composer.set(typedPath(['core.clock']), {
    elapsed: 0,
    lastWall: null,
  })(frame);

  frame = ModuleManager.load(Pause)(frame);
  frame = ModuleManager.load(Phase)(frame);
  frame = ModuleManager.load(Mode)(frame);
  frame = ModuleManager.load(Rand)(frame);
  frame = ModuleManager.load(Dealer)(frame);

  frame = gamePipe(tick(frame));
  frame = gamePipe(tick(frame));

  frame = withImpulse(Pause.setPaused(false))(tick(frame));
  for (let i = 0; i < 300; i++) {
    frame = gamePipe(tick(frame, 100));
  }

  frame = withImpulse(Phase.setPhase(GamePhase.active))(tick(frame));
  frame = gamePipe(tick(frame));

  return frame;
}

function getDiceState(frame: GameFrame) {
  return (frame as any)?.core?.dice as
    | { busy: boolean; log: any[] }
    | undefined;
}

function runUntilBusy(frame: GameFrame): GameFrame {
  for (let i = 0; i < 500; i++) {
    frame = gamePipe(tick(frame, 100));
    if (getDiceState(frame)?.busy) return frame;
  }
  return frame;
}

describe('Dealer integration', () => {
  it('should start idle with an empty log', () => {
    const frame = startGame();
    const state = getDiceState(frame);
    expect(state).toBeDefined();
    expect(state!.busy).toBe(false);
    expect(state!.log).toEqual([]);
  });

  it('should eventually trigger an outcome during active phase', () => {
    let frame = startGame();
    frame = runUntilBusy(frame);

    const state = getDiceState(frame)!;
    expect(state.busy).toBe(true);
    expect(state.log.length).toBeGreaterThan(0);
  });

  it('should unbusy when outcome signals done', () => {
    let frame = startGame();
    frame = runUntilBusy(frame);
    expect(getDiceState(frame)?.busy).toBe(true);

    frame = withImpulse(Events.dispatch({ type: OUTCOME_DONE }))(tick(frame));

    expect(getDiceState(frame)?.busy).toBe(false);
  });

  it('should not trigger outcomes before active phase', () => {
    let frame = gamePipe(makeFrame());

    frame = Composer.set(typedPath(['settings']), {
      ...defaultSettings,
      events: Object.values(DiceEvent),
    })(frame);
    frame = Composer.set(typedPath(['images']), [])(frame);
    frame = Composer.set(typedPath(['core.intensity']), { intensity: 0.5 })(
      frame
    );
    frame = Composer.set(typedPath(['core.pace']), {
      pace: 2,
      prevMinPace: 1,
      prevPace: 2,
      history: [],
    })(frame);
    frame = Composer.set(typedPath(['core.clock']), {
      elapsed: 0,
      lastWall: null,
    })(frame);

    frame = ModuleManager.load(Pause)(frame);
    frame = ModuleManager.load(Phase)(frame);
    frame = ModuleManager.load(Mode)(frame);
    frame = ModuleManager.load(Rand)(frame);
    frame = ModuleManager.load(Dealer)(frame);

    frame = gamePipe(tick(frame));
    frame = gamePipe(tick(frame));

    frame = withImpulse(Pause.setPaused(false))(tick(frame));
    for (let i = 0; i < 500; i++) {
      frame = gamePipe(tick(frame, 100));
      expect(getDiceState(frame)?.busy).toBe(false);
    }
  });

  it('should not trigger a second outcome while busy', () => {
    let frame = startGame();
    frame = runUntilBusy(frame);
    expect(getDiceState(frame)?.busy).toBe(true);

    const logLength = getDiceState(frame)!.log.length;

    for (let i = 0; i < 50; i++) {
      frame = gamePipe(tick(frame, 100));
    }

    expect(getDiceState(frame)!.log.length).toBe(logLength);
  });

  it('should stop triggering outcomes when mode leaves classic', () => {
    let frame = startGame();

    frame = withImpulse(Mode.setMode('freeplay'))(tick(frame));
    frame = gamePipe(tick(frame));

    for (let i = 0; i < 500; i++) {
      frame = gamePipe(tick(frame, 100));
    }

    expect(getDiceState(frame)?.busy).toBe(false);
    expect(getDiceState(frame)?.log.length ?? 0).toBe(0);
  });
});
