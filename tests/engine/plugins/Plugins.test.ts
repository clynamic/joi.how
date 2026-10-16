import { describe, it, expect } from 'vitest';
import { definePlugin } from '../../../src/engine/plugins/Plugins';
import { sdk } from '../../../src/engine/sdk';

describe('definePlugin', () => {
  it('should publish the plugin on the sdk under its sdk name at definition', () => {
    const plugin = definePlugin({ id: 'test.published', sdk: 'Published' });

    expect((sdk as any).Published).toBe(plugin);
    expect((globalThis as any).sdk.Published).toBe(plugin);
  });

  it('should keep a plugin without an sdk name off the sdk', () => {
    definePlugin({ id: 'test.private' });

    expect(Object.values(sdk)).not.toContainEqual(
      expect.objectContaining({ id: 'test.private' })
    );
  });

  it('should return the plugin unchanged', () => {
    const input = { id: 'test.same', sdk: 'Same', extra: 1 };

    expect(definePlugin(input)).toBe(input);
  });
});
