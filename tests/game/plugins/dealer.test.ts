import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Scheduler } from '../../../src/engine/pipes/Scheduler';
import { Events } from '../../../src/engine/pipes/Events';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame } from '../../../src/engine/State';
import { typedPath } from '../../../src/engine/Lens';
import Phase, { GamePhase } from '../../../src/game/plugins/phase';
import Pause from '../../../src/game/plugins/pause';
import Rand from '../../../src/game/plugins/rand';
import Dealer from '../../../src/game/plugins/dealer';
import Saves from '../../../src/game/plugins/saves';

const DEALER_ID = 'core.dice';
import Messages from '../../../src/game/plugins/messages';
import { doublePaceChance } from '../../../src/game/plugins/dice/doublePace';
import { DiceEvent } from '../../../src/types';
import { OUTCOME_DONE } from '../../../src/game/plugins/dice/types';
import { defaultSettings } from '../../../src/settings/Settings';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

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
  frame = ModuleManager.load(Rand)(frame);
  frame = ModuleManager.load(Dealer)(frame);

  frame = gamePipe(tick(frame));
  frame = gamePipe(tick(frame));

  frame = withImpulse(Pause.setPaused(false))(tick(frame));
  for (let i = 0; i < 300; i++) {
    frame = gamePipe(tick(frame, 100));
  }

  frame = gamePipe(tick(frame, 1));
  frame = withImpulse(Phase.setPhase(GamePhase.active))(tick(frame, 1));
  frame = gamePipe(tick(frame, 1));

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

  it('should offer each triggered outcome to onOutcome', () => {
    const watcher = {
      id: 'test.watch',
      ordering: { loadAfter: [Dealer.id] },
      update: Dealer.onOutcome(event =>
        Composer.over(['seen'], (list: string[]) => [...list, event], [])
      ),
    };
    let frame = withImpulse(ModuleManager.load(watcher))(tick(startGame(), 1));
    frame = gamePipe(tick(frame, 1));
    frame = runUntilBusy(frame);

    const state = getDiceState(frame)!;
    expect(state.log.length).toBeGreaterThan(0);
    expect(frame.seen).toEqual(state.log.map(entry => entry.event));
  });

  it('should regrip silently whenever the phase returns to active', () => {
    let frame = startGame();
    const before = (frame as any).core.dice.paws;
    const logBefore = getDiceState(frame)!.log.length;

    frame = withImpulse(Phase.setPhase(GamePhase.break))(tick(frame, 1));
    frame = gamePipe(tick(frame, 1));
    frame = withImpulse(Phase.setPhase(GamePhase.active))(tick(frame, 1));
    frame = gamePipe(tick(frame, 1));
    frame = gamePipe(tick(frame, 1));

    expect((frame as any).core.dice.paws).not.toBe(before);
    expect(getDiceState(frame)!.log).toHaveLength(logBefore);
  });

  it('should scale double pace odds with intensity', () => {
    expect(doublePaceChance(0)).toBe(50);
    expect(doublePaceChance(20)).toBe(50);
    expect(doublePaceChance(60)).toBe(40);
    expect(doublePaceChance(100)).toBe(30);
  });

  it('should roll against a chance that depends on the frame', () => {
    let frame = startGame(0.99);
    frame = Composer.pipe(
      Composer.set(typedPath(['settings', 'events']), [DiceEvent.doublePace]),
      Composer.set(typedPath(['core.rand']), { seed: 'fixed', cursor: 4242 })
    )(frame);

    for (let i = 0; i < 3000 && !getDiceState(frame)?.busy; i++) {
      frame = gamePipe(tick(frame, 100));
    }

    expect(getDiceState(frame)!.log.map(e => e.event)).toEqual([
      DiceEvent.doublePace,
    ]);
  });

  it('should end a ruined climax on good job after clenching', () => {
    let frame = startGame(1);
    frame = Composer.pipe(
      Composer.set(typedPath(['settings', 'events']), [DiceEvent.climax]),
      Composer.set(typedPath(['settings', 'climaxChance']), 100),
      Composer.set(typedPath(['settings', 'ruinChance']), 100),
      ModuleManager.load(Messages)
    )(frame);
    frame = gamePipe(tick(frame, 1));
    frame = runUntilBusy(frame);
    expect(getDiceState(frame)!.log[0]?.event).toBe(DiceEvent.climax);

    const titles: string[] = [];
    const seen = (f: GameFrame) => {
      for (const m of (f as any).core.messages?.messages ?? []) {
        if (titles.at(-1) !== m.title) titles.push(m.title);
      }
    };
    let edged = false;
    for (let t = 0; t < 120000; t += 100) {
      frame = gamePipe(tick(frame, 100));
      seen(frame);
      if (!edged && titles.includes('Are you edging?')) {
        edged = true;
        frame = withImpulse(
          Events.dispatch({ type: 'core.dice/climax.edging' })
        )(tick(frame, 1));
      }
      if (titles.includes('Good job, $player')) break;
    }

    const clench = titles.indexOf('Clench in desperation');
    const good = titles.indexOf('Good job, $player');
    expect(titles).toContain('$HANDS OFF! Ruin your orgasm!');
    expect(clench).toBeGreaterThan(-1);
    expect(good).toBeGreaterThan(clench);
    const last = (frame as any).core.messages.messages.at(-1);
    expect(last.prompts?.map((p: { title: string }) => p.title)).toEqual([
      'Leave',
    ]);
  });

  it('should keep rolling after a blank load', () => {
    let frame = Composer.set(Rand.paths.cursor, 7)(startGame());
    frame = runUntilBusy(frame);
    expect(getDiceState(frame)?.busy).toBe(true);

    frame = withImpulse(Saves.reset())(tick(frame));
    frame = gamePipe(tick(frame));
    expect(getDiceState(frame)).toMatchObject({ busy: false, log: [] });
    expect(frame.core.phase.current).toBe(GamePhase.warmup);

    frame = withImpulse(Phase.setPhase(GamePhase.active))(tick(frame));
    frame = runUntilBusy(frame);
    expect(getDiceState(frame)?.busy).toBe(true);
    expect(getDiceState(frame)?.log).toHaveLength(1);
  });

  it('should drop its state, its timers and its outcomes when unloaded', () => {
    let frame = startGame();
    const armed = Scheduler.snapshot(frame, DEALER_ID).length;

    frame = gamePipe(tick(ModuleManager.unload(DEALER_ID)(frame)));
    frame = gamePipe(tick(frame));
    frame = gamePipe(tick(frame));

    expect(armed).toBeGreaterThan(0);
    expect(getDiceState(frame)?.log).toBeUndefined();
    expect(Scheduler.snapshot(frame, DEALER_ID)).toEqual([]);
    expect(
      frame.core.modules.order.filter((id: string) => id.startsWith(DEALER_ID))
    ).toEqual([]);
  });
});
