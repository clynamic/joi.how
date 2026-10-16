import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { Events } from '../../../src/engine/pipes/Events';
import {
  Log,
  LOG_CAPACITY,
  LogEntry,
  PRINTED_CAPACITY,
  render,
} from '../../../src/engine/pipes/Log';
import { sdk } from '../../../src/engine/sdk';
import { makeFrame, tick } from '../../utils';

const queued = (frame: ReturnType<typeof makeFrame>): LogEntry[] =>
  (frame?.core?.effects?.queue ?? [])
    .filter((e: { type: string }) => e.type === 'core.log/line')
    .map((e: { payload: LogEntry }) => e.payload);

const entry_ = (
  level: LogEntry['level'],
  message = 'hello',
  source = 'test.plugin'
): LogEntry => ({ level, source, message, tick: 0, time: 0 });

describe('Log', () => {
  beforeEach(() => {
    Log.clear();
    sdk.debug = false;
  });
  afterEach(() => {
    vi.restoreAllMocks();
    sdk.debug = false;
  });

  describe('lines', () => {
    it('should queue an entry stamped with the frame tick and time', () => {
      const frame = Log.info('test.plugin', 'hello', { n: 1 })(
        Effects.pipe(tick(tick(makeFrame())))
      );

      expect(queued(frame)).toEqual([
        {
          level: 'info',
          source: 'test.plugin',
          message: 'hello',
          data: { n: 1 },
          tick: 2,
          time: 32,
        },
      ]);
    });

    it('should leave data out when none is given', () => {
      const frame = Log.warn('test.plugin', 'bare')(Effects.pipe(makeFrame()));

      expect(queued(frame)[0]).not.toHaveProperty('data');
    });

    it('should be performed by the engine without any module', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const frame = Composer.pipe(
        Effects.pipe,
        Events.pipe,
        Log.warn('test.plugin', 'engine level')
      )(makeFrame());

      Effects.flush(frame, () => undefined);

      expect(Log.entries().map(e => e.message)).toEqual(['engine level']);
      expect(warn).toHaveBeenCalledWith('[test.plugin] engine level');
    });
  });

  describe('ring', () => {
    it('should keep only the newest entries up to capacity', () => {
      for (let i = 0; i < LOG_CAPACITY + 50; i++) {
        Log.perform(entry_('debug', `m${i}`));
      }

      const kept = Log.entries();
      expect(kept).toHaveLength(LOG_CAPACITY);
      expect(kept[0].message).toBe('m50');
      expect(kept.at(-1)?.message).toBe(`m${LOG_CAPACITY + 49}`);
    });

    it('should forget everything on clear', () => {
      Log.perform(entry_('info'));
      Log.clear();

      expect(Log.entries()).toEqual([]);
    });
  });

  describe('rendering', () => {
    it('should fill placeholders from data at render time', () => {
      const entry = {
        ...entry_('warn', '{phase} took {duration}ms'),
        data: { phase: 'update', duration: 1.37 },
      };

      expect(render(entry)).toBe('update took 1.37ms');
    });

    it('should leave a placeholder with no data literally', () => {
      expect(render(entry_('warn', 'missing {nothing} here'))).toBe(
        'missing {nothing} here'
      );
    });

    it('should keep the template as the dedupe key', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      Log.perform({ ...entry_('warn', 'took {n}ms'), data: { n: 1 } });
      Log.perform({ ...entry_('warn', 'took {n}ms'), data: { n: 2 } });

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith('[test.plugin] took 1ms');
    });

    it('should print data not named in the template after the line', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      Log.perform({
        ...entry_('warn', 'over budget in {phase}'),
        data: { phase: 'update', budget: 1 },
      });

      expect(warn).toHaveBeenCalledWith('[test.plugin] over budget in update', {
        budget: 1,
      });
    });

    it('should forget the oldest printed keys past capacity', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});

      for (let i = 0; i < PRINTED_CAPACITY + 1; i++) {
        Log.perform(entry_('error', `e${i}`));
      }
      Log.perform(entry_('error', 'e0'));

      expect(error).toHaveBeenCalledTimes(PRINTED_CAPACITY + 2);
    });
  });

  describe('printing', () => {
    it('should print a warning or error the first time it appears', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});

      Log.perform(entry_('warn', 'w'));
      Log.perform(entry_('error', 'e', 'other.plugin'));

      expect(warn).toHaveBeenCalledWith('[test.plugin] w');
      expect(error).toHaveBeenCalledWith('[other.plugin] e');
    });

    it('should print a repeated message once unless debug is on', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});

      Log.perform(entry_('error', 'same'));
      Log.perform(entry_('error', 'same'));
      expect(error).toHaveBeenCalledTimes(1);

      sdk.debug = true;
      Log.perform(entry_('error', 'same'));
      expect(error).toHaveBeenCalledTimes(2);
    });

    it('should treat the same message from another source as new', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});

      Log.perform(entry_('error', 'same', 'a'));
      Log.perform(entry_('error', 'same', 'b'));

      expect(error).toHaveBeenCalledTimes(2);
    });

    it('should keep info and debug silent unless debug is on', () => {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});

      Log.perform(entry_('info', 'quiet'));
      Log.perform(entry_('debug', 'quieter'));
      expect(log).not.toHaveBeenCalled();

      sdk.debug = true;
      Log.perform(entry_('info', 'loud'));
      expect(log).toHaveBeenCalledWith('[test.plugin] loud');
    });

    it('should pass data through to the console', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      Log.perform({ ...entry_('warn', 'with data'), data: { k: 1 } });

      expect(warn).toHaveBeenCalledWith('[test.plugin] with data', { k: 1 });
    });
  });
});
