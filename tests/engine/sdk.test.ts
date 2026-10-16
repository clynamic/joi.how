import { describe, it, expect } from 'vitest';
import { definePlugin } from '../../src/engine/plugins/Plugins';
import { sdk } from '../../src/engine/sdk';

describe('sdk.index', () => {
  it('should list engine entries apart from plugins', () => {
    const { engine, plugins } = sdk.index();

    expect(engine).toEqual(
      expect.arrayContaining(['Composer', 'Effects', 'Events', 'Scheduler'])
    );
    expect(engine).not.toContain('index');
    expect(plugins.map(p => p.sdk)).not.toContain('Composer');
  });

  it('should describe a plugin with its hooks and commands', () => {
    definePlugin({
      id: 'test.indexed',
      sdk: 'Indexed',
      meta: { name: 'Indexed', description: 'for the index test' },
      activate: f => f,
      update: f => f,
      poke: () => (f: unknown) => f,
      onPoke: () => (f: unknown) => f,
      whenPoked: () => (f: unknown) => f,
    });

    const entry = sdk.index().plugins.find(p => p.sdk === 'Indexed');

    expect(entry).toEqual({
      sdk: 'Indexed',
      id: 'test.indexed',
      name: 'Indexed',
      description: 'for the index test',
      hooks: ['onPoke', 'whenPoked'],
      commands: ['poke'],
    });
  });

  it('should sort plugins by their sdk name', () => {
    definePlugin({ id: 'test.z', sdk: 'Zeta' });
    definePlugin({ id: 'test.a', sdk: 'Alpha' });

    const names = sdk.index().plugins.map(p => p.sdk);

    expect(names.indexOf('Alpha')).toBeLessThan(names.indexOf('Zeta'));
  });
});
