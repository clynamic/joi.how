import { describe, it, expect } from 'vitest';
import { Composer } from '../src/engine/Composer';
import { Scheduler } from '../src/engine/pipes/Scheduler';
import { makeFrame, makeGame } from './utils';

const fired = (frame: any): string[] =>
  (frame.core?.events?.current ?? []).map((e: { type: string }) => e.type);

describe('makeGame until', () => {
  it('should return the first frame where the predicate holds', () => {
    const { pipe, until } = makeGame([]);
    const armed = Composer.pipe(
      Scheduler.setRate('t', 1),
      Scheduler.schedule({
        id: 'a',
        duration: 50,
        timeline: 't',
        event: { type: 'test/a' },
      })
    )(pipe(makeFrame()));

    const frame = until(armed, f => fired(f).includes('test/a'), {
      step: 10,
      maxTicks: 7,
    });

    expect(fired(frame)).toEqual(['test/a']);
    expect(frame.tick).toBe(7);
  });

  it('should throw past the tick budget', () => {
    const { pipe, until } = makeGame([]);

    expect(() =>
      until(pipe(makeFrame()), () => false, { maxTicks: 3 })
    ).toThrow('within 3 ticks');
  });
});
