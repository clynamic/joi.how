import { describe, it, expect } from 'vitest';
import {
  defaultSettings,
  normalizeSettings,
} from '../../src/settings/Settings';

describe('normalizeSettings', () => {
  it('should keep the maximum pace at or above the minimum', () => {
    const ordered = normalizeSettings({
      ...defaultSettings,
      minPace: 2,
      maxPace: 5,
    });
    const crossed = normalizeSettings({
      ...defaultSettings,
      minPace: 4,
      maxPace: 1,
    });

    expect([ordered.minPace, ordered.maxPace]).toEqual([2, 5]);
    expect([crossed.minPace, crossed.maxPace]).toEqual([4, 4]);
  });
});
