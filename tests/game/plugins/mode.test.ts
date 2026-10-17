import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Mode from '../../../src/game/plugins/mode';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

const seen = (frame: GameFrame): string[] => frame.seen ?? [];
const record = (label: string): Pipe =>
  Composer.over(['seen'], (list: string[]) => [...list, label], []);

const watch: Pipe = Composer.pipe(
  Mode.onEnter('classic', () => record('entered classic')),
  Mode.onLeave('classic', () => record('left classic')),
  Mode.onEnter('dj', () => record('entered dj'))
);

function bootstrap(): GameFrame {
  let frame = gamePipe(makeFrame());
  frame = ModuleManager.load(Mode)(frame);
  frame = ModuleManager.load({ id: 'test.watch', update: watch })(frame);
  frame = gamePipe(tick(frame));
  frame = gamePipe(tick(frame));
  return gamePipe(tick(frame));
}

describe('Mode', () => {
  it('should start in classic without announcing an entry', () => {
    const frame = bootstrap();

    expect(frame.core.mode.current).toBe('classic');
    expect(seen(frame)).toEqual([]);
  });

  it('should list registered modes and drop them on unregister', () => {
    let frame = bootstrap();
    frame = withImpulse(
      Composer.pipe(
        Mode.register({ id: 'classic', name: 'Classic' }),
        Mode.register({ id: 'dj', name: 'DJ', description: 'Beats' })
      )
    )(tick(frame));
    const both = frame.core.mode.modes;

    frame = withImpulse(Mode.unregister('dj'))(tick(frame));

    expect(both).toEqual({
      classic: { id: 'classic', name: 'Classic' },
      dj: { id: 'dj', name: 'DJ', description: 'Beats' },
    });
    expect(frame.core.mode.modes).toEqual({
      classic: { id: 'classic', name: 'Classic' },
    });
  });

  it('should keep the current mode and say so when the target is not registered', () => {
    let frame = bootstrap();

    frame = withImpulse(Mode.setMode('dj'))(tick(frame));
    frame = gamePipe(tick(frame));
    frame = gamePipe(tick(frame));

    expect(frame.core.mode.current).toBe('classic');
    expect(seen(frame)).toEqual([]);
  });

  it('should switch to a registered mode and fire leave then enter', () => {
    let frame = bootstrap();
    frame = withImpulse(Mode.register({ id: 'dj', name: 'DJ' }))(tick(frame));

    frame = withImpulse(Mode.setMode('dj'))(tick(frame));
    frame = gamePipe(tick(frame));
    frame = gamePipe(tick(frame));

    expect(frame.core.mode.current).toBe('dj');
    expect(seen(frame)).toEqual(['left classic', 'entered dj']);
  });
});
