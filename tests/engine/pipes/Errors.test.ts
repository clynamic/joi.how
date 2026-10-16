import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { Events } from '../../../src/engine/pipes/Events';
import { Errors, type ErrorEntry } from '../../../src/engine/pipes/Errors';
import { Effects } from '../../../src/engine/pipes/Effects';
import { Log } from '../../../src/engine/pipes/Log';
import { lensFromPath } from '../../../src/engine/Lens';
import { sdk } from '../../../src/engine/sdk';
import { makeFrame, tick } from '../../utils';

const basePipe: Pipe = Events.pipe;

const flush = (frame: GameFrame) => Effects.flush(frame, () => undefined);

const getEntry = (
  frame: GameFrame,
  pluginId: string,
  phase: string
): ErrorEntry | undefined =>
  lensFromPath(['core.errors', 'plugins', pluginId, phase]).get(frame);

describe('Errors', () => {
  beforeEach(() => {
    sdk.debug = true;
    Log.clear();
  });
  afterEach(() => {
    sdk.debug = false;
  });

  describe('withCatch', () => {
    it('should not affect a pipe that does not throw', () => {
      const noop: Pipe = frame => frame;
      const pipe = Composer.pipe(
        basePipe,
        Errors.withCatch('test.plugin', 'update', noop)
      );

      const result = pipe(makeFrame());
      const entry = getEntry(result, 'test.plugin', 'update');

      expect(entry).toBeUndefined();
    });

    it('should catch errors and store them in context', () => {
      const failing: Pipe = () => {
        throw new Error('boom');
      };
      const pipe = Composer.pipe(
        basePipe,
        Errors.withCatch('test.plugin', 'update', failing)
      );

      const result = pipe(makeFrame());
      const entry = getEntry(result, 'test.plugin', 'update');

      expect(entry).toBeDefined();
      expect(entry!.message).toBe('boom');
      expect(entry!.phase).toBe('update');
      expect(entry!.count).toBe(1);
      expect(entry!.stack).toBeDefined();
      expect(entry!.timestamp).toBeGreaterThan(0);
    });

    it('should let the tick continue after an error', () => {
      const failing: Pipe = () => {
        throw new Error('boom');
      };
      let ranAfter = false;
      const after: Pipe = frame => {
        ranAfter = true;
        return frame;
      };

      const pipe = Composer.pipe(
        basePipe,
        Errors.withCatch('test.plugin', 'update', failing),
        after
      );

      pipe(makeFrame());
      expect(ranAfter).toBe(true);
    });

    it('should increment count on repeated errors', () => {
      const failing: Pipe = () => {
        throw new Error('boom');
      };
      const pipe = Composer.pipe(
        basePipe,
        Errors.withCatch('test.plugin', 'update', failing)
      );

      let frame = makeFrame();
      for (let i = 0; i < 5; i++) {
        frame = pipe(tick(frame));
      }

      const entry = getEntry(frame, 'test.plugin', 'update');
      expect(entry!.count).toBe(5);
    });

    it('should track separate plugins independently', () => {
      const failA: Pipe = () => {
        throw new Error('fail-a');
      };
      const failB: Pipe = () => {
        throw new Error('fail-b');
      };
      const pipe = Composer.pipe(
        basePipe,
        Errors.withCatch('plugin.a', 'update', failA),
        Errors.withCatch('plugin.b', 'update', failB)
      );

      const result = pipe(makeFrame());

      expect(getEntry(result, 'plugin.a', 'update')!.message).toBe('fail-a');
      expect(getEntry(result, 'plugin.b', 'update')!.message).toBe('fail-b');
    });

    it('should track separate phases independently', () => {
      const fail: Pipe = () => {
        throw new Error('boom');
      };
      const pipe = Composer.pipe(
        basePipe,
        Errors.withCatch('test.plugin', 'activate', fail),
        Errors.withCatch('test.plugin', 'update', fail)
      );

      const result = pipe(makeFrame());

      expect(getEntry(result, 'test.plugin', 'activate')).toBeDefined();
      expect(getEntry(result, 'test.plugin', 'update')).toBeDefined();
    });

    it('should handle non-Error throws', () => {
      const failing: Pipe = () => {
        throw 'string error';
      };
      const pipe = Composer.pipe(
        basePipe,
        Errors.withCatch('test.plugin', 'update', failing)
      );

      const result = pipe(makeFrame());
      const entry = getEntry(result, 'test.plugin', 'update');

      expect(entry!.message).toBe('string error');
      expect(entry!.stack).toBeUndefined();
    });

    it('should print the first occurrence even without debug', () => {
      sdk.debug = false;
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failing: Pipe = () => {
        throw new Error('boom');
      };

      flush(
        Composer.pipe(
          basePipe,
          Errors.withCatch('test.plugin', 'update', failing)
        )(makeFrame())
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toBe('[test.plugin] update: boom');
      spy.mockRestore();
    });

    it('should print repeated identical errors once without debug', () => {
      sdk.debug = false;
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failing: Pipe = () => {
        throw new Error('boom');
      };
      const pipe = Composer.pipe(
        Effects.pipe,
        basePipe,
        Errors.withCatch('test.plugin', 'update', failing)
      );

      let frame = makeFrame();
      for (let i = 0; i < 5; i++) {
        frame = pipe(tick(frame));
        flush(frame);
      }

      expect(spy).toHaveBeenCalledTimes(1);
      expect(Log.entries().filter(e => e.level === 'error')).toHaveLength(5);
      spy.mockRestore();
    });

    it('should print every repeat with debug on', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failing: Pipe = () => {
        throw new Error('boom');
      };
      const pipe = Composer.pipe(
        Effects.pipe,
        basePipe,
        Errors.withCatch('test.plugin', 'update', failing)
      );

      let frame = makeFrame();
      for (let i = 0; i < 3; i++) {
        frame = pipe(tick(frame));
        flush(frame);
      }

      expect(spy).toHaveBeenCalledTimes(3);
      spy.mockRestore();
    });

    it('should print again when the error message changes', () => {
      sdk.debug = false;
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let msg = 'first';
      const failing: Pipe = () => {
        throw new Error(msg);
      };
      const pipe = Composer.pipe(
        Effects.pipe,
        basePipe,
        Errors.withCatch('test.plugin', 'update', failing)
      );

      const frame = pipe(makeFrame());
      flush(frame);
      msg = 'second';
      flush(pipe(tick(frame)));

      expect(spy).toHaveBeenCalledTimes(2);
      spy.mockRestore();
    });

    it('should store errors without any setup pipe', () => {
      const failing: Pipe = () => {
        throw new Error('boom');
      };
      const pipe = Composer.pipe(
        Events.pipe,
        Errors.withCatch('test.plugin', 'update', failing)
      );

      const result = pipe(makeFrame());
      const entry = getEntry(result, 'test.plugin', 'update');

      expect(entry).toBeDefined();
      expect(entry!.message).toBe('boom');
    });

    it('should preserve error entries across frames', () => {
      const failing: Pipe = () => {
        throw new Error('boom');
      };

      const frame0 = Composer.pipe(
        basePipe,
        Errors.withCatch('test.plugin', 'update', failing)
      )(makeFrame());

      expect(getEntry(frame0, 'test.plugin', 'update')).toBeDefined();

      const frame1 = basePipe(tick(frame0));
      expect(getEntry(frame1, 'test.plugin', 'update')).toBeDefined();
    });
  });
});
