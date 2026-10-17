import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { Events } from '../../../src/engine/pipes/Events';
import { Effects } from '../../../src/engine/pipes/Effects';
import {
  Perf,
  type PerfConfig,
  type PluginPerfEntry,
} from '../../../src/engine/pipes/Perf';
import { lensFromPath } from '../../../src/engine/Lens';
import { sdk } from '../../../src/engine/sdk';
import { makeFrame, tick } from '../../utils';

const basePipe: Pipe = Composer.pipe(Effects.pipe, Events.pipe, Perf.pipe);

const getEntry = (
  frame: GameFrame,
  pluginId: string,
  phase: string
): PluginPerfEntry | undefined =>
  lensFromPath(['core.perf', 'plugins', pluginId, phase]).get(frame);

const getConfig = (frame: GameFrame): PerfConfig | undefined =>
  lensFromPath(['core.perf', 'config']).get(frame);

const overBudgetEvents = (frame: GameFrame) =>
  (frame?.core?.events?.pending ?? []).filter(
    (e: any) => e.type === 'core.perf/over_budget'
  );

const warnings = (frame: GameFrame) =>
  (frame?.core?.effects?.queue ?? []).filter(
    (e: any) => e.type === 'core.log/line'
  );

function recordFor(
  frame: GameFrame,
  ticks: number,
  duration: number,
  phase = 'update'
): { frame: GameFrame; events: number; lines: number } {
  let events = 0;
  let lines = 0;
  for (let i = 0; i < ticks; i++) {
    frame = Composer.pipe(
      basePipe,
      Perf.record('test.plugin', phase, duration)
    )(tick(frame));
    events += overBudgetEvents(frame).length;
    lines += warnings(frame).length;
  }
  return { frame, events, lines };
}

describe('Perf', () => {
  beforeEach(() => {
    sdk.debug = true;
  });
  afterEach(() => {
    sdk.debug = false;
  });

  describe('Perf.pipe', () => {
    it('should preserve existing metrics across frames', () => {
      const frame0 = basePipe(makeFrame());

      const noop: Pipe = frame => frame;
      const timed = Perf.withTiming('test.plugin', 'update', noop);
      const frame1 = Composer.pipe(basePipe, timed)(tick(frame0));

      expect(getEntry(frame1, 'test.plugin', 'update')).toBeDefined();

      const frame2 = basePipe(tick(frame1));
      expect(getEntry(frame2, 'test.plugin', 'update')).toBeDefined();
    });
  });

  describe('withTiming', () => {
    it('should record a duration into the perf context', () => {
      const noop: Pipe = frame => frame;
      const pipe = Composer.pipe(
        basePipe,
        Perf.withTiming('test.plugin', 'update', noop)
      );

      const result = pipe(makeFrame());
      const entry = getEntry(result, 'test.plugin', 'update');

      expect(entry).toBeDefined();
      expect(entry!.last).toBeGreaterThanOrEqual(0);
      expect(entry!.perFrame).toBeGreaterThanOrEqual(0);
      expect(entry!.max).toBeGreaterThanOrEqual(0);
      expect(entry!.samples).toHaveLength(1);
    });

    it('should track max as the all time high', () => {
      let slowOnce = true;
      const sometimesSlow: Pipe = frame => {
        if (slowOnce) {
          slowOnce = false;
          const end = performance.now() + 1;
          while (performance.now() < end /* busy wait */);
        }
        return frame;
      };

      const pipe = Composer.pipe(
        basePipe,
        Perf.withTiming('test.plugin', 'update', sometimesSlow)
      );

      let frame = pipe(makeFrame());
      const maxAfterSlow = getEntry(frame, 'test.plugin', 'update')!.max;
      expect(maxAfterSlow).toBeGreaterThan(0.5);

      frame = pipe(tick(frame));
      const maxAfterFast = getEntry(frame, 'test.plugin', 'update')!.max;
      expect(maxAfterFast).toBeGreaterThanOrEqual(maxAfterSlow);
    });

    it('should track separate phases and plugins independently', () => {
      const noop: Pipe = frame => frame;
      const pipe = Composer.pipe(
        basePipe,
        Perf.withTiming('test.plugin', 'activate', noop),
        Perf.withTiming('test.plugin', 'update', noop),
        Perf.withTiming('plugin.b', 'update', noop)
      );

      const result = pipe(makeFrame());

      expect(getEntry(result, 'test.plugin', 'activate')).toBeDefined();
      expect(getEntry(result, 'test.plugin', 'update')).toBeDefined();
      expect(getEntry(result, 'plugin.b', 'update')).toBeDefined();
    });

    it('should work without Perf.pipe', () => {
      const noop: Pipe = frame => frame;
      const pipe = Composer.pipe(
        Events.pipe,
        Perf.withTiming('test.plugin', 'update', noop)
      );

      const result = pipe(makeFrame());
      const entry = getEntry(result, 'test.plugin', 'update');

      expect(entry).toBeDefined();
      expect(entry!.last).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Perf.record', () => {
    it('should keep samples with their tick and derive average, per frame and max', () => {
      const frame0 = basePipe(makeFrame());
      const frame1 = Perf.record('test.plugin', 'perform tone', 3)(frame0);
      const frame2 = Perf.record(
        'test.plugin',
        'perform tone',
        5
      )(tick(frame1));

      const entry = getEntry(frame2, 'test.plugin', 'perform tone');
      expect(entry).toMatchObject({
        last: 5,
        avg: 4,
        max: 5,
        perFrame: 8 / 60,
        samples: [
          { duration: 3, tick: 0 },
          { duration: 5, tick: 1 },
        ],
        lastTick: 1,
      });
    });

    it('should keep several samples from one tick', () => {
      const frame = Composer.pipe(
        basePipe,
        Perf.record('test.plugin', 'perform tone', 1),
        Perf.record('test.plugin', 'perform tone', 2)
      )(makeFrame());

      expect(getEntry(frame, 'test.plugin', 'perform tone')!.samples).toEqual([
        { duration: 1, tick: 0 },
        { duration: 2, tick: 0 },
      ]);
    });

    it('should drop samples older than sixty ticks from the window', () => {
      const { frame } = recordFor(basePipe(makeFrame()), 80, 1);

      const entry = getEntry(frame, 'test.plugin', 'update')!;
      expect(entry.samples).toHaveLength(60);
      expect(entry.samples[0].tick).toBe(80 - 60 + 1);
      expect(entry.perFrame).toBe(1);
    });

    it('should let the cost per frame fall once a plugin goes quiet', () => {
      let { frame } = recordFor(basePipe(makeFrame()), 60, 1);
      const busy = getEntry(frame, 'test.plugin', 'update')!.perFrame;

      for (let i = 0; i < 30; i++) frame = basePipe(tick(frame));
      const fading = getEntry(frame, 'test.plugin', 'update')!;
      for (let i = 0; i < 30; i++) frame = basePipe(tick(frame));
      const quiet = getEntry(frame, 'test.plugin', 'update')!;

      expect(busy).toBe(1);
      expect(fading.perFrame).toBe(0.5);
      expect(fading.max).toBe(1);
      expect(quiet.perFrame).toBe(0);
      expect(quiet.samples).toEqual([]);
    });

    it('should read a rare call as a small cost per frame', () => {
      const frame = Perf.record(
        'test.plugin',
        'perform persist',
        6
      )(basePipe(makeFrame()));

      expect(getEntry(frame, 'test.plugin', 'perform persist')!.perFrame).toBe(
        0.1
      );
    });
  });

  describe('over budget', () => {
    it('should report once when the per frame cost crosses the budget', () => {
      const { frame, events, lines } = recordFor(basePipe(makeFrame()), 90, 2);

      expect(events).toBe(1);
      expect(lines).toBe(1);
      expect(getEntry(frame, 'test.plugin', 'update')!.over).toBe(true);
    });

    it('should name the plugin, the phase and the cost in the warning', () => {
      let frame = basePipe(makeFrame());
      let line: any;
      for (let i = 0; i < 90 && !line; i++) {
        frame = Composer.pipe(
          basePipe,
          Perf.record('test.plugin', 'update', 2)
        )(tick(frame));
        line = warnings(frame)[0];
      }

      expect(line.payload).toMatchObject({
        level: 'warn',
        source: 'test.plugin',
        message:
          '{phase} is over budget at {perFrame}ms per frame (budget {budget}ms)',
        data: { phase: 'update', budget: 1 },
      });
      expect(line.payload.data.perFrame).toBeGreaterThan(1);
    });

    it('should stay silent for a single slow call', () => {
      const frame = Perf.record(
        'test.plugin',
        'update',
        6
      )(basePipe(makeFrame()));

      expect(overBudgetEvents(frame)).toHaveLength(0);
      expect(warnings(frame)).toHaveLength(0);
    });

    it('should report again after the cost drops back under budget and rises', () => {
      const first = recordFor(basePipe(makeFrame()), 90, 2);
      const calm = recordFor(first.frame, 90, 0);
      const second = recordFor(calm.frame, 90, 2);

      expect(first.events).toBe(1);
      expect(calm.events).toBe(0);
      expect(second.events).toBe(1);
    });
  });

  describe('Perf.configure', () => {
    it('should update budget via configure event', () => {
      const frame0 = basePipe(makeFrame());

      const frame1 = Perf.configure({ pluginBudget: 2 })(frame0);
      const frame2 = basePipe(tick(frame1));

      const config = getConfig(frame2);
      expect(config!.pluginBudget).toBe(2);
    });
  });
});
