import { describe, it, expect } from 'vitest';
import { Composer } from '../Composer';
import { GameFrame, Pipe } from '../State';
import { Events } from './Events';
import {
  perfPipe,
  withTiming,
  Perf,
  type PerfContext,
  type PluginPerfEntry,
} from './Perf';

const makeFrame = (overrides?: Partial<GameFrame>): GameFrame => ({
  state: {},
  context: { tick: 0, deltaTime: 16, elapsedTime: 0 },
  ...overrides,
});

const tick = (frame: GameFrame): GameFrame => ({
  ...frame,
  context: {
    ...frame.context,
    tick: frame.context.tick + 1,
    deltaTime: 16,
    elapsedTime: frame.context.elapsedTime + 16,
  },
});

const basePipe: Pipe = Composer.pipe(Events.pipe, perfPipe);

const getPerfCtx = (frame: GameFrame): PerfContext | undefined =>
  (frame.context as any)?.core?.perf;

const getEntry = (
  frame: GameFrame,
  pluginId: string,
  phase: string
): PluginPerfEntry | undefined =>
  (getPerfCtx(frame)?.plugins as any)?.[pluginId]?.[phase];

describe('Perf', () => {
  describe('perfPipe', () => {
    it('should preserve existing metrics across frames', () => {
      const frame0 = basePipe(makeFrame());

      const noop: Pipe = frame => frame;
      const timed = withTiming('test.plugin', 'update', noop);
      const frame1 = Composer.pipe(basePipe, timed)(tick(frame0));

      expect(getEntry(frame1, 'test.plugin', 'update')).toBeDefined();

      const frame2 = basePipe(tick(frame1));
      expect(getEntry(frame2, 'test.plugin', 'update')).toBeDefined();
    });
  });

  describe('withTiming', () => {
    it('should record duration into perf context', () => {
      const noop: Pipe = frame => frame;
      const pipe = Composer.pipe(
        basePipe,
        withTiming('test.plugin', 'update', noop)
      );

      const result = pipe(makeFrame());
      const entry = getEntry(result, 'test.plugin', 'update');

      expect(entry).toBeDefined();
      expect(entry!.last).toBeGreaterThanOrEqual(0);
      expect(entry!.avg).toBeGreaterThanOrEqual(0);
      expect(entry!.max).toBeGreaterThanOrEqual(0);
      expect(entry!.samples).toHaveLength(1);
    });

    it('should accumulate samples across invocations', () => {
      const noop: Pipe = frame => frame;
      const pipe = Composer.pipe(
        basePipe,
        withTiming('test.plugin', 'update', noop)
      );

      let frame = makeFrame();
      for (let i = 0; i < 5; i++) {
        frame = pipe(tick(frame));
      }

      const entry = getEntry(frame, 'test.plugin', 'update');
      expect(entry!.samples).toHaveLength(5);
    });

    it('should cap rolling window at 60 samples', () => {
      const noop: Pipe = frame => frame;
      const pipe = Composer.pipe(
        basePipe,
        withTiming('test.plugin', 'update', noop)
      );

      let frame = makeFrame();
      for (let i = 0; i < 80; i++) {
        frame = pipe(tick(frame));
      }

      const entry = getEntry(frame, 'test.plugin', 'update');
      expect(entry!.samples).toHaveLength(60);
    });

    it('should track max as all-time high', () => {
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
        withTiming('test.plugin', 'update', sometimesSlow)
      );

      let frame = pipe(makeFrame());
      const maxAfterSlow = getEntry(frame, 'test.plugin', 'update')!.max;
      expect(maxAfterSlow).toBeGreaterThan(0.5);

      frame = pipe(tick(frame));
      const maxAfterFast = getEntry(frame, 'test.plugin', 'update')!.max;
      expect(maxAfterFast).toBeGreaterThanOrEqual(maxAfterSlow);
    });

    it('should track separate phases independently', () => {
      const noop: Pipe = frame => frame;
      const pipe = Composer.pipe(
        basePipe,
        withTiming('test.plugin', 'activate', noop),
        withTiming('test.plugin', 'update', noop)
      );

      const result = pipe(makeFrame());

      expect(getEntry(result, 'test.plugin', 'activate')).toBeDefined();
      expect(getEntry(result, 'test.plugin', 'update')).toBeDefined();
    });

    it('should track separate plugins independently', () => {
      const noop: Pipe = frame => frame;
      const pipe = Composer.pipe(
        basePipe,
        withTiming('plugin.a', 'update', noop),
        withTiming('plugin.b', 'update', noop)
      );

      const result = pipe(makeFrame());

      expect(getEntry(result, 'plugin.a', 'update')).toBeDefined();
      expect(getEntry(result, 'plugin.b', 'update')).toBeDefined();
    });

    it('should work without perfPipe (graceful fallback)', () => {
      const noop: Pipe = frame => frame;
      const pipe = Composer.pipe(
        Events.pipe,
        withTiming('test.plugin', 'update', noop)
      );

      const result = pipe(makeFrame());
      const entry = getEntry(result, 'test.plugin', 'update');

      expect(entry).toBeDefined();
      expect(entry!.last).toBeGreaterThanOrEqual(0);
    });
  });

  describe('over budget events', () => {
    it('should dispatch over_budget event when plugin exceeds budget', () => {
      const slow: Pipe = frame => {
        const end = performance.now() + 6;
        while (performance.now() < end /* busy wait */);
        return frame;
      };

      const pipe = Composer.pipe(
        basePipe,
        withTiming('test.plugin', 'update', slow)
      );
      const frame1 = pipe(makeFrame());

      const pending = (frame1.state as any)?.core?.events?.pending ?? [];
      const overBudgetEvents = pending.filter(
        (e: any) => e.type === 'core.perf/over_budget'
      );

      expect(overBudgetEvents).toHaveLength(1);
      expect(overBudgetEvents[0].payload.id).toBe('test.plugin');
      expect(overBudgetEvents[0].payload.phase).toBe('update');
      expect(overBudgetEvents[0].payload.duration).toBeGreaterThan(4);
    });

    it('should not dispatch event when within budget', () => {
      const noop: Pipe = frame => frame;
      const pipe = Composer.pipe(
        basePipe,
        withTiming('test.plugin', 'update', noop)
      );
      const frame1 = pipe(makeFrame());

      const pending = (frame1.state as any)?.core?.events?.pending ?? [];
      const overBudgetEvents = pending.filter(
        (e: any) => e.type === 'core.perf/over_budget'
      );

      expect(overBudgetEvents).toHaveLength(0);
    });
  });

  describe('Perf.configure', () => {
    it('should update budget via configure event', () => {
      const frame0 = basePipe(makeFrame());

      const frame1 = Perf.configure({ pluginBudget: 2 })(frame0);
      const frame2 = basePipe(tick(frame1));

      const ctx = getPerfCtx(frame2);
      expect(ctx!.config.pluginBudget).toBe(2);
    });
  });
});
