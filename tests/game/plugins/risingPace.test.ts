import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Events } from '../../../src/engine/pipes/Events';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame } from '../../../src/engine/State';
import Pause from '../../../src/game/plugins/pause';
import Phase from '../../../src/game/plugins/phase';
import Pace from '../../../src/game/plugins/pace';
import Messages from '../../../src/game/plugins/messages';
import { risingPaceModule } from '../../../src/game/plugins/dice/risingPace';
import { defaultSettings } from '../../../src/settings/Settings';
import { intensityToPaceRange, round } from '../../../src/utils';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse, until } = makeGame();

const titles = (frame: GameFrame): string[] =>
  (frame.core.messages?.messages ?? []).map((m: { title: string }) => m.title);

function playing(maxPace: number, intensity = 1): GameFrame {
  let frame = gamePipe(makeFrame());
  frame = Composer.set(['settings'], {
    ...defaultSettings,
    minPace: 1,
    maxPace,
  })(frame);
  frame = Composer.set(['core.intensity'], { intensity })(frame);
  for (const p of [Pause, Phase, Pace, Messages, risingPaceModule]) {
    frame = ModuleManager.load(p)(frame);
  }
  frame = gamePipe(tick(frame));
  frame = Composer.set(Pause.paths.paused, false)(frame);
  return until(frame, f => f.core.scheduler.rates.play === 1);
}

describe('rising pace', () => {
  it('should announce paces rounded to two decimals up to a rounded top', () => {
    let frame = playing(10, 0.4);
    const { max } = intensityToPaceRange(
      40,
      defaultSettings.steepness,
      defaultSettings.timeshift,
      { min: 1, max: 10 }
    );
    frame = withImpulse(
      Events.dispatch({ type: Events.getKey('core.dice', 'risingPace') })
    )(tick(frame));

    const announced: number[] = [];
    for (let i = 0; i < 60; i++) {
      frame = gamePipe(tick(frame, 1000));
      for (const title of titles(frame)) {
        const match = title.match(/^Pace rising to (.+)!$/);
        if (match) announced.push(Number(match[1]));
      }
    }

    expect(max).not.toBe(round(max));
    expect(announced.at(-1)).toBe(round(max));
    expect(announced.every(p => p === round(p))).toBe(true);
  });

  it('should climb from the minimum to the maximum without overshooting', () => {
    let frame = playing(4.5);
    frame = withImpulse(
      Events.dispatch({ type: Events.getKey('core.dice', 'risingPace') })
    )(tick(frame));

    const announced: number[] = [];
    const paces = new Set<number>();
    for (let i = 0; i < 60; i++) {
      frame = gamePipe(tick(frame, 1000));
      paces.add(frame.core.pace.pace);
      for (const title of titles(frame)) {
        const match = title.match(/^Pace rising to (.+)!$/);
        if (match) announced.push(Number(match[1]));
      }
    }

    expect(Math.max(...paces)).toBe(4.5);
    expect(announced.every(p => p <= 4.5)).toBe(true);
    expect(announced.at(-1)).toBe(4.5);
  });
});
