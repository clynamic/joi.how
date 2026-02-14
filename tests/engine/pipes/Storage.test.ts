import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Storage, STORAGE_NAMESPACE, StorageContext } from '../../../src/engine/pipes/Storage';
import { GameFrame } from '../../../src/engine/State';
import { Composer } from '../../../src/engine/Composer';

describe('Storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Storage.bind', () => {
    it('should load value from localStorage', () => {
      localStorage.setItem('test.key', JSON.stringify({ value: 42 }));

      let result: any;
      const pipe = Storage.bind('test.key', (value: any) => {
        result = value;
        return (frame: GameFrame) => frame;
      });

      const frame: GameFrame = {
        state: {},
        context: { tick: 0, step: 0, time: 0 },
      };

      pipe(frame);
      expect(result).toEqual({ value: 42 });
    });

    it('should return undefined for missing key', () => {
      let result: any;
      const pipe = Storage.bind('missing.key', (value: any) => {
        result = value;
        return (frame: GameFrame) => frame;
      });

      const frame: GameFrame = {
        state: {},
        context: { tick: 0, step: 0, time: 0 },
      };

      pipe(frame);
      expect(result).toBeUndefined();
    });

    it('should use cached values when available', () => {
      let callCount = 0;
      const pipe = Storage.bind('test.key', () => {
        callCount++;
        return (frame: GameFrame) => frame;
      });

      let frame1: GameFrame = {
        state: {},
        context: { tick: 0, step: 0, time: 1000 },
      };

      frame1 = Composer.over<Partial<StorageContext>>(
        ['context', STORAGE_NAMESPACE],
        (storage = {}) => ({
          cache: {},
          ...storage,
        })
      )(frame1);

      pipe(frame1);
      expect(callCount).toBe(1);

      let frame2: GameFrame = {
        state: {},
        context: { tick: 1, step: 16, time: 1016 },
      };

      frame2 = Composer.over<Partial<StorageContext>>(
        ['context', STORAGE_NAMESPACE],
        (storage = {}) => ({
          cache: {
            'test.key': {
              value: 'cached',
              expiry: 31000,
            },
          },
          ...storage,
        })
      )(frame2);

      pipe(frame2);
      expect(callCount).toBe(2);
    });
  });

  describe('Storage.set', () => {
    it('should write to localStorage', () => {
      const pipe = Storage.set('test.key', { foo: 'bar' });

      const frame: GameFrame = {
        state: {},
        context: { tick: 0, step: 0, time: 0 },
      };

      pipe(frame);

      const stored = localStorage.getItem('test.key');
      expect(JSON.parse(stored!)).toEqual({ foo: 'bar' });
    });

    it('should update cache', () => {
      const pipe = Storage.set('test.key', 'value');

      let frame: GameFrame = {
        state: {},
        context: { tick: 0, step: 0, time: 1000 },
      };

      frame = Composer.over<Partial<StorageContext>>(
        ['context', STORAGE_NAMESPACE],
        (storage = {}) => ({
          cache: {},
          ...storage,
        })
      )(frame);

      const result = pipe(frame);

      const storage = result.context.how.joi.storage;
      expect(storage.cache['test.key'].value).toBe('value');
      expect(storage.cache['test.key'].expiry).toBe(31000);
    });
  });

  describe('Storage.remove', () => {
    it('should remove from localStorage', () => {
      localStorage.setItem('test.key', 'value');

      const pipe = Storage.remove('test.key');

      const frame: GameFrame = {
        state: {},
        context: { tick: 0, step: 0, time: 0 },
      };

      pipe(frame);

      expect(localStorage.getItem('test.key')).toBeNull();
    });

    it('should remove from cache', () => {
      const pipe = Storage.remove('test.key');

      let frame: GameFrame = {
        state: {},
        context: { tick: 0, step: 0, time: 0 },
      };

      frame = Composer.over<Partial<StorageContext>>(
        ['context', STORAGE_NAMESPACE],
        (storage = {}) => ({
          cache: {
            'test.key': { value: 'foo', expiry: 1000 },
          },
          ...storage,
        })
      )(frame);

      const result = pipe(frame);

      const storage = result.context.how.joi.storage;
      expect(storage.cache['test.key']).toBeUndefined();
    });
  });

  describe('Storage.pipe', () => {
    it('should clean up expired cache entries', () => {
      let frame: GameFrame = {
        state: {},
        context: { tick: 0, step: 0, time: 20000 },
      };

      frame = Composer.over<Partial<StorageContext>>(
        ['context', STORAGE_NAMESPACE],
        (storage = {}) => ({
          cache: {
            'expired.key': { value: 'old', expiry: 10000 },
            'valid.key': { value: 'new', expiry: 50000 },
          },
          ...storage,
        })
      )(frame);

      const result = Storage.pipe(frame);

      const storage = result.context.how.joi.storage;
      expect(storage.cache['expired.key']).toBeUndefined();
      expect(storage.cache['valid.key']).toBeDefined();
      expect(storage.cache['valid.key'].value).toBe('new');
    });
  });
});
