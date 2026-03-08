/**
 * Storage Pipe
 *
 * Primitive pipe that provides access to localStorage.
 * Uses lazy loading with time-based cache (hot settings).
 *
 * Architecture:
 * - Settings are loaded on-demand from localStorage
 * - Cached in context with expiry time (measured in game time)
 * - Hot cache expires after inactivity to save memory
 * - Writes are immediate to localStorage and update cache
 */

import { Composer } from '../Composer';
import { typedPath } from '../Lens';
import { pluginPaths } from '../plugins/Plugins';
import { GameTiming, Pipe } from '../State';

export const STORAGE_NAMESPACE = 'how.joi.storage';
const CACHE_TTL = 30000; // 30 seconds of game time

export type CacheEntry = {
  value: any;
  expiry: number; // game time when this expires
};

export type StorageContext = {
  cache: { [key: string]: CacheEntry };
};

const storage = pluginPaths<StorageContext>(STORAGE_NAMESPACE);
const timing = typedPath<GameTiming>([]);

/**
 * Storage API for reading and writing to localStorage
 */
export class Storage {
  /**
   * Loads a value from localStorage
   */
  private static load<T = any>(key: string): T | undefined {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        return JSON.parse(value) as T;
      }
    } catch (e) {
      console.error(`Failed to load from localStorage key "${key}":`, e);
    }
    return undefined;
  }

  /**
   * Gets a value, using cache or loading from localStorage
   */
  static bind<T = any>(key: string, fn: (value: T | undefined) => Pipe): Pipe {
    return Composer.bind(storage, ctx => {
      const cache = ctx?.cache || {};
      const cached = cache[key];

      if (cached) {
        return fn(cached.value as T | undefined);
      }

      const value = Storage.load<T>(key);

      return Composer.pipe(
        Composer.bind(timing.time, elapsedTime =>
          Composer.over(storage, ctx => ({
            cache: {
              ...(ctx?.cache || {}),
              [key]: {
                value,
                expiry: elapsedTime + CACHE_TTL,
              },
            },
          }))
        ),
        fn(value)
      );
    });
  }

  /**
   * Sets a value in localStorage and updates cache
   */
  static set<T = any>(key: string, value: T): Pipe {
    return frame => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error('Failed to write to localStorage:', e);
      }

      return Composer.bind(timing.time, elapsedTime =>
        Composer.over(storage, ctx => ({
          cache: {
            ...(ctx?.cache || {}),
            [key]: {
              value,
              expiry: elapsedTime + CACHE_TTL,
            },
          },
        }))
      )(frame);
    };
  }

  /**
   * Removes a value from localStorage and cache
   */
  static remove(key: string): Pipe {
    return frame => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('Failed to remove from localStorage:', e);
      }

      return Composer.over(storage, ctx => {
        const newCache = { ...(ctx?.cache || {}) };
        delete newCache[key];
        return { cache: newCache };
      })(frame);
    };
  }

  /**
   * Storage pipe - evicts expired cache entries
   */
  static pipe: Pipe = Composer.pipe(
    Composer.bind(timing.time, elapsedTime =>
      Composer.over(storage, ctx => {
        const newCache: { [key: string]: CacheEntry } = {};

        for (const [key, entry] of Object.entries(ctx?.cache || {})) {
          if (entry.expiry > elapsedTime) {
            newCache[key] = entry;
          }
        }

        return { cache: newCache };
      })
    )
  );
}
