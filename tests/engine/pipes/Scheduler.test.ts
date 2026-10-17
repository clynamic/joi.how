import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Events } from '../../../src/engine/pipes/Events';
import {
  ENGINE_TIMELINE,
  Scheduler,
  ScheduledEvent,
} from '../../../src/engine/pipes/Scheduler';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { makeFrame, tick } from '../../utils';

const basePipe: Pipe = Composer.pipe(Events.pipe, Scheduler.pipe);

const scheduled = (frame: GameFrame): ScheduledEvent[] =>
  frame?.core?.scheduler?.scheduled ?? [];

const rates = (frame: GameFrame): Record<string, number> =>
  frame?.core?.scheduler?.rates ?? {};

const fired = (frame: GameFrame): string[] =>
  (frame?.core?.events?.current ?? []).map((e: { type: string }) => e.type);

function step(
  frame: GameFrame,
  impulse: Pipe = f => f,
  extra: Pipe = f => f
): GameFrame {
  return Composer.pipe(impulse, basePipe, extra)(tick(frame));
}

const entry = (id: string, duration: number, timeline?: string): Pipe =>
  Scheduler.schedule({
    id,
    duration,
    timeline,
    event: { type: `test/${id}` },
  });

describe('Scheduler', () => {
  describe('firing', () => {
    it('should fire an event once its duration has elapsed', () => {
      let frame = step(basePipe(makeFrame()), entry('a', 40));
      frame = step(frame);
      expect(scheduled(frame).map(e => e.id)).toEqual(['a']);

      frame = step(frame);
      frame = step(frame);
      expect(scheduled(frame)).toEqual([]);

      frame = step(frame);
      expect(fired(frame)).toContain('test/a');
    });

    it('should keep held entries frozen', () => {
      let frame = step(basePipe(makeFrame()), entry('a', 100));
      frame = step(frame, Scheduler.hold('a'));
      const before = scheduled(frame)[0].duration;

      frame = step(frame);
      frame = step(frame);

      expect(scheduled(frame)[0].duration).toBe(before);
    });
  });

  describe('remaining', () => {
    it('should report the time left on an entry by id or prefix', () => {
      let frame = step(
        basePipe(makeFrame()),
        Composer.pipe(entry('ns/a', 100), entry('other/b', 500))
      );
      frame = step(frame);

      expect(Scheduler.remaining(frame, 'ns/a')).toBe(84);
      expect(Scheduler.remaining(frame, 'ns/')).toBe(84);
      expect(Scheduler.remaining(frame, 'other/b')).toBe(484);
      expect(Scheduler.remaining(frame, 'nope')).toBeUndefined();
    });
  });

  describe('timelines', () => {
    it('should run entries without a timeline at the tick step', () => {
      let frame = step(basePipe(makeFrame()), entry('a', 100));
      frame = step(frame);
      frame = step(frame);

      expect(scheduled(frame)[0].duration).toBe(100 - 16 * 2);
    });

    it('should hold an entry on a timeline with no rate', () => {
      let frame = step(basePipe(makeFrame()), entry('a', 100, 'unknown'));
      frame = step(frame);

      expect(scheduled(frame)[0].duration).toBe(100);
    });

    it('should scale a timeline by its rate', () => {
      let frame = step(basePipe(makeFrame()), Scheduler.setRate('slow', 0.5));
      frame = step(frame, entry('a', 100, 'slow'));
      frame = step(frame);
      frame = step(frame);

      expect(scheduled(frame)[0].duration).toBe(100 - 8 * 2);
    });

    it('should freeze a timeline at rate 0 and move it again at 1', () => {
      let frame = step(basePipe(makeFrame()), Scheduler.setRate('x', 0));
      frame = step(frame, entry('a', 100, 'x'));
      frame = step(frame);
      frame = step(frame);
      expect(scheduled(frame)[0].duration).toBe(100);

      frame = step(frame, Scheduler.setRate('x', 1));
      frame = step(frame);
      expect(scheduled(frame)[0].duration).toBe(84);
    });

    it('should leave other timelines alone when one is stopped', () => {
      let frame = step(
        basePipe(makeFrame()),
        Composer.pipe(Scheduler.setRate('x', 0), Scheduler.setRate('y', 1))
      );
      frame = step(
        frame,
        Composer.pipe(
          entry('a', 100, 'x'),
          entry('b', 100, 'y'),
          entry('c', 100)
        )
      );
      frame = step(frame);

      expect(scheduled(frame).map(e => e.duration)).toEqual([100, 84, 84]);
    });

    it('should ignore a rate that is not a finite non-negative number', () => {
      let frame = step(
        basePipe(makeFrame()),
        Composer.pipe(Scheduler.setRate('x', 1), entry('a', 100, 'x'))
      );
      for (const bad of [NaN, -1, Infinity]) {
        frame = step(frame, Scheduler.setRate('x', bad));
      }
      frame = step(frame);

      expect(rates(frame)).toEqual({ x: 1 });
      expect(scheduled(frame)[0].duration).toBe(100 - 16 * 4);
      const warnings = (frame?.core?.effects?.queue ?? []).filter(
        (e: { type: string; payload: { message: string } }) =>
          e.type === 'core.log/line' &&
          e.payload.message === 'ignored rate {rate} for {timeline}'
      );
      expect(warnings).toHaveLength(3);
      expect(warnings[0].payload).toMatchObject({
        level: 'warn',
        source: 'core.scheduler',
        data: { rate: 'NaN', timeline: 'x' },
      });
    });

    it('should warn once when an entry names a timeline with no rate', () => {
      const lines = (f: GameFrame) =>
        (f?.core?.effects?.queue ?? []).filter(
          (e: { type: string; payload: { message: string } }) =>
            e.type === 'core.log/line' &&
            e.payload.message === 'timeline {timeline} has no rate set'
        );
      let frame = step(basePipe(makeFrame()), entry('a', 100, 'typo.once'));
      frame = step(frame, entry('b', 100, 'typo.once'));

      expect(lines(frame)).toHaveLength(1);
      expect(lines(frame)[0].payload.data).toEqual({ timeline: 'typo.once' });
    });

    it('should not warn when the rate is set in the same tick', () => {
      const frame = step(
        basePipe(makeFrame()),
        Composer.pipe(
          Scheduler.setRate('same.tick', 1),
          entry('a', 100, 'same.tick')
        )
      );

      const lines = (frame?.core?.effects?.queue ?? []).filter(
        (e: { type: string }) => e.type === 'core.log/line'
      );
      expect(lines).toEqual([]);
    });

    it('should refuse to change the engine timeline', () => {
      let frame = step(
        basePipe(makeFrame()),
        Scheduler.setRate(ENGINE_TIMELINE, 0)
      );
      frame = step(frame, entry('a', 100, ENGINE_TIMELINE));
      frame = step(frame);

      expect(rates(frame)).toEqual({});
      expect(scheduled(frame)[0].duration).toBe(84);
    });

    it('should keep entries and stop their timeline when it is removed', () => {
      let frame = step(
        basePipe(makeFrame()),
        Composer.pipe(Scheduler.setRate('x', 1), Scheduler.setRate('y', 1))
      );
      frame = step(
        frame,
        Composer.pipe(entry('a', 100, 'x'), entry('b', 100, 'y'))
      );
      frame = step(frame, Scheduler.removeTimeline('x'));
      frame = step(frame);

      expect(scheduled(frame).map(e => [e.id, e.duration])).toEqual([
        ['a', 84],
        ['b', 68],
      ]);
      expect(rates(frame)).toEqual({ y: 1 });
    });
  });

  describe('rate events', () => {
    const seen = (frame: GameFrame): unknown[] => frame.seen ?? [];
    const record = (label: string): Pipe =>
      Composer.over(['seen'], (list: unknown[]) => [...list, label], []);

    it('should report a rate change with its from and to', () => {
      const watch = Scheduler.onRate('x', change =>
        Composer.over(['seen'], (list: unknown[]) => [...list, change], [])
      );
      let frame = step(
        basePipe(makeFrame()),
        Scheduler.setRate('x', 0.5),
        watch
      );
      frame = step(frame, f => f, watch);

      expect(seen(frame)).toEqual([{ timeline: 'x', from: 0, to: 0.5 }]);
    });

    it('should not report a change to the same rate', () => {
      const watch = Scheduler.onRate('x', () => record('changed'));
      let frame = step(basePipe(makeFrame()), Scheduler.setRate('x', 0), watch);
      frame = step(frame, f => f, watch);

      expect(seen(frame)).toEqual([]);
    });

    it('should report a removed timeline as a stop', () => {
      const watch = Scheduler.onRate('x', change =>
        Composer.over(['seen'], (list: unknown[]) => [...list, change], [])
      );
      let frame = step(basePipe(makeFrame()), Scheduler.setRate('x', 2), watch);
      frame = step(frame, Scheduler.removeTimeline('x'), watch);
      frame = step(frame, Scheduler.removeTimeline('x'), watch);
      frame = step(frame, f => f, watch);

      expect(seen(frame)).toEqual([
        { timeline: 'x', from: 0, to: 2 },
        { timeline: 'x', from: 2, to: 0 },
      ]);
    });

    it('should fire onStop and onStart only on the zero crossing', () => {
      const watch = Composer.pipe(
        Scheduler.onStop('x', () => record('stop')),
        Scheduler.onStart('x', () => record('start'))
      );
      let frame = basePipe(makeFrame());
      for (const rate of [0.5, 0, 0, 2, 1]) {
        frame = step(frame, Scheduler.setRate('x', rate), watch);
        frame = step(frame, f => f, watch);
      }

      expect(seen(frame)).toEqual(['start', 'stop', 'start']);
    });

    it('should only report its own timeline', () => {
      const watch = Scheduler.onStop('x', () => record('x stopped'));
      let frame = step(basePipe(makeFrame()), Scheduler.setRate('y', 1), watch);
      frame = step(frame, f => f, watch);

      expect(seen(frame)).toEqual([]);
    });
  });
});
