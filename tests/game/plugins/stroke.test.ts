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
import Pause from '../../../src/game/plugins/pause';
import Phase, { GamePhase } from '../../../src/game/plugins/phase';
import Stroke from '../../../src/game/plugins/stroke';
import { makeFrame, tick } from '../../utils';

const gamePipe: Pipe = Composer.pipe(
  Effects.pipe,
  Events.pipe,
  Scheduler.pipe,
  moduleManagerPipe
);

const withImpulse = (impulse: Pipe): Pipe => Composer.pipe(impulse, gamePipe);

const seen = (frame: GameFrame): string[] => frame.seen ?? [];

const watcher = {
  id: 'test.watch',
  ordering: { loadAfter: [Stroke.id] },
  update: Stroke.onFlip(stroke =>
    Composer.over(['seen'], (list: string[]) => [...list, stroke], [])
  ),
};

function bootstrap(pace = 2): GameFrame {
  let frame = gamePipe(makeFrame());
  frame = Composer.set(['core.pace'], { pace })(frame);
  for (const plugin of [Pause, Phase, Stroke, watcher]) {
    frame = ModuleManager.load(plugin)(frame);
  }
  frame = gamePipe(tick(frame));
  frame = gamePipe(tick(frame));
  frame = withImpulse(Pause.setPaused(false))(tick(frame));
  for (let i = 0; i < 60; i++) frame = gamePipe(tick(frame, 100));
  return withImpulse(Phase.setPhase(GamePhase.active))(tick(frame, 1));
}

describe('Stroke', () => {
  it('should offer each flip to onFlip with its direction', () => {
    let frame = bootstrap(2);
    for (let i = 0; i < 12; i++) frame = gamePipe(tick(frame, 100));

    expect(seen(frame)).toEqual(['down', 'up']);
    expect(frame.core.stroke.stroke).toBe('up');
  });

  it('should not flip outside the active and finale phases', () => {
    let frame = bootstrap(2);
    frame = withImpulse(Phase.setPhase(GamePhase.break))(tick(frame, 1));
    for (let i = 0; i < 12; i++) frame = gamePipe(tick(frame, 100));

    expect(seen(frame)).toEqual([]);
  });
});
