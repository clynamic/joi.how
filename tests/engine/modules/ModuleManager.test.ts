import { describe, it, expect } from 'vitest';
import {
  ModuleManager,
  moduleManagerPipe,
} from '../../../src/engine/modules/ModuleManager';
import { Module } from '../../../src/engine/modules/Module';
import { Effects } from '../../../src/engine/pipes/Effects';
import { Events } from '../../../src/engine/pipes/Events';
import { Composer } from '../../../src/engine/Composer';
import { Pipe, GameFrame } from '../../../src/engine/State';
import { sdk } from '../../../src/engine/sdk';
import { makeFrame, tick } from '../../utils';

const gamePipe: Pipe = Composer.pipe(
  Effects.pipe,
  Events.pipe,
  moduleManagerPipe
);

const getOrder = (frame: GameFrame): string[] =>
  (frame as any)?.core?.modules?.order ?? [];

const getRegistry = (frame: GameFrame): Record<string, any> =>
  (frame as any)?.core?.modules?.registry ?? {};

function load(module: Module): GameFrame {
  const frame0 = gamePipe(makeFrame());
  const frame1 = ModuleManager.load(module)(frame0);
  return gamePipe(tick(frame1));
}

describe('ModuleManager', () => {
  describe('reloading', () => {
    const mark = (label: string): Pipe =>
      Composer.over(['marks'], (list: string[]) => [...list, label], []);

    it('should swap a module loaded again under the same id', () => {
      const v1: Module = {
        id: 'mod.re',
        activate: mark('v1 up'),
        deactivate: mark('v1 down'),
      };
      const v2: Module = {
        id: 'mod.re',
        activate: mark('v2 up'),
        deactivate: mark('v2 down'),
      };

      const frame1 = load(v1);
      const frame2 = gamePipe(tick(ModuleManager.load(v2)(frame1)));
      const frame3 = gamePipe(tick(frame2));

      expect(frame3.marks).toEqual(['v1 up', 'v1 down', 'v2 up']);
      expect(getOrder(frame3).filter(id => id === 'mod.re')).toHaveLength(1);
      expect(getRegistry(frame3)['mod.re']).toBe(v2);
    });

    it('should leave a module alone when the same object is loaded again', () => {
      const once: Module = {
        id: 'mod.same',
        activate: mark('up'),
        deactivate: mark('down'),
      };

      const frame1 = load(once);
      const frame2 = gamePipe(tick(ModuleManager.load(once)(frame1)));

      expect(frame2.marks).toEqual(['up']);
    });

    it('should reload a module by id, deactivating before activating again', () => {
      const mod: Module = {
        id: 'test.mod',
        activate: Composer.pipe(mark('activate'), Composer.set(['n'], 1)),
        update: Composer.over(['n'], (n: number) => n + 1),
        deactivate: mark('deactivate'),
      };
      let frame = load(mod);
      frame = gamePipe(tick(frame));
      const before = frame.n;

      frame = gamePipe(tick(ModuleManager.reload('test.mod')(frame)));

      expect(before).toBe(3);
      expect(frame.marks).toEqual(['activate', 'deactivate', 'activate']);
      expect(frame.n).toBe(2);
      expect(getOrder(frame)).toEqual(['test.mod']);
      expect(getRegistry(frame)['test.mod']).toBe(mod);
    });

    it('should reload a module loaded again in the tick it is unloaded', () => {
      const mod: Module = {
        id: 'test.mod',
        activate: mark('activate'),
        deactivate: mark('deactivate'),
      };
      let frame = load(mod);

      frame = gamePipe(
        tick(
          Composer.pipe(
            ModuleManager.unload('test.mod'),
            ModuleManager.load(mod)
          )(frame)
        )
      );

      expect(frame.marks).toEqual(['activate', 'deactivate', 'activate']);
      expect(getOrder(frame)).toEqual(['test.mod']);
    });

    it('should apply loads and unloads in the order they were dispatched', () => {
      const mod: Module = {
        id: 'test.mod',
        activate: mark('activate'),
        deactivate: mark('deactivate'),
      };
      let frame = gamePipe(makeFrame());

      frame = gamePipe(
        tick(
          Composer.pipe(
            ModuleManager.load(mod),
            ModuleManager.unload('test.mod')
          )(frame)
        )
      );
      frame = gamePipe(tick(frame));

      expect(frame.marks).toBeUndefined();
      expect(getOrder(frame)).toEqual([]);
      expect(getRegistry(frame)).toEqual({});
    });

    it('should deactivate a module once when it is unloaded twice in one tick', () => {
      const mod: Module = {
        id: 'test.mod',
        activate: mark('activate'),
        deactivate: mark('deactivate'),
      };
      let frame = load(mod);

      frame = gamePipe(
        tick(
          Composer.pipe(
            ModuleManager.unload('test.mod'),
            ModuleManager.unload('test.mod')
          )(frame)
        )
      );

      expect(frame.marks).toEqual(['activate', 'deactivate']);
    });

    it('should republish a reloaded module on the sdk', () => {
      const v1: Module = { id: 'mod.pub', sdk: 'Republished' };
      const v2: Module = { id: 'mod.pub', sdk: 'Republished' };

      load(v1);
      expect((sdk as any).Republished).toBe(v1);

      const frame = gamePipe(tick(ModuleManager.load(v2)(load(v1))));

      expect(getRegistry(frame)['mod.pub']).toBe(v2);
      expect((sdk as any).Republished).toBe(v2);
    });
  });

  describe('load-time checks', () => {
    const lines = (frame: GameFrame) =>
      (frame?.core?.effects?.queue ?? [])
        .filter((e: { type: string }) => e.type === 'core.log/line')
        .map(
          (e: {
            payload: { level: string; source: string; message: string };
          }) => e.payload
        );

    it('should log and keep the engine entry when an sdk name is taken', () => {
      const frame = load({ id: 'mod.clash', sdk: 'Composer' });

      expect((sdk as any).Composer).toBe(Composer);
      expect(lines(frame)).toContainEqual(
        expect.objectContaining({
          level: 'error',
          source: 'mod.clash',
          message: 'sdk name {name} is taken by {owner}',
        })
      );
    });

    it('should log a duplicated effect type when the second module loads', () => {
      const first: Module = {
        id: 'mod.first',
        effects: [{ type: 'x/ping', perform: () => undefined }],
      };
      const second: Module = {
        id: 'mod.second',
        effects: [{ type: 'x/ping', perform: () => undefined }],
      };

      const frame1 = load(first);
      const frame2 = gamePipe(tick(ModuleManager.load(second)(frame1)));

      expect(lines(frame1)).toEqual([]);
      expect(lines(frame2)).toContainEqual(
        expect.objectContaining({
          level: 'error',
          source: 'mod.second',
          message: 'effect {type} is already performed by {owner}',
        })
      );
    });
  });

  describe('sdk publishing', () => {
    it('should publish a plain module with an sdk name when it loads', () => {
      const plain: Module = { id: 'mod.plain', sdk: 'PlainMod' };
      expect((sdk as any).PlainMod).toBeUndefined();

      load(plain);

      expect((sdk as any).PlainMod).toBe(plain);
    });

    it('should not replace a plugin already published under that name', () => {
      const first: Module = { id: 'mod.first', sdk: 'Taken' };
      const second: Module = { id: 'mod.second', sdk: 'Taken' };

      load(first);
      load(second);

      expect((sdk as any).Taken).toBe(first);
    });
  });

  describe('Load / Unload', () => {
    it('should load a module after event cycle', () => {
      const result = load({ id: 'test.mod' });
      expect(getOrder(result)).toContain('test.mod');
      expect(getRegistry(result)).toHaveProperty('test.mod');
    });

    it('should unload a module after event cycle', () => {
      const frame1 = load({ id: 'test.mod' });
      expect(getOrder(frame1)).toContain('test.mod');

      const frame2 = ModuleManager.unload('test.mod')(frame1);
      const frame3 = gamePipe(tick(frame2));

      expect(getOrder(frame3)).not.toContain('test.mod');
      expect(getRegistry(frame3)).not.toHaveProperty('test.mod');
    });

    it('should not load the same module twice', () => {
      const frame1 = load({ id: 'test.mod' });

      const frame2 = ModuleManager.load({ id: 'test.mod' })(frame1);
      const frame3 = gamePipe(tick(frame2));

      expect(getOrder(frame3).filter(id => id === 'test.mod')).toHaveLength(1);
    });

    it('should ignore unload for unknown module', () => {
      const frame0 = gamePipe(makeFrame());
      const frame1 = ModuleManager.unload('ghost')(frame0);
      const frame2 = gamePipe(tick(frame1));

      expect(getOrder(frame2)).toHaveLength(0);
    });
  });

  describe('Lifecycle phases', () => {
    it('should call activate on load', () => {
      let called = false;

      load({
        id: 'test.mod',
        activate: (frame: GameFrame) => {
          called = true;
          return frame;
        },
      });

      expect(called).toBe(true);
    });

    it('should call deactivate on unload', () => {
      let called = false;

      const frame1 = load({
        id: 'test.mod',
        deactivate: (frame: GameFrame) => {
          called = true;
          return frame;
        },
      });

      const frame2 = ModuleManager.unload('test.mod')(frame1);
      gamePipe(tick(frame2));

      expect(called).toBe(true);
    });

    it('should run update every frame', () => {
      let count = 0;

      const frame1 = load({
        id: 'test.mod',
        update: (frame: GameFrame) => {
          count++;
          return frame;
        },
      });
      expect(count).toBe(1);

      gamePipe(tick(frame1));
      expect(count).toBe(2);

      gamePipe(tick(frame1));
      expect(count).toBe(3);
    });

    it('should run phases in order: beforeUpdate → update → afterUpdate', () => {
      const order: string[] = [];

      load({
        id: 'test.mod',
        beforeUpdate: (frame: GameFrame) => {
          order.push('before');
          return frame;
        },
        update: (frame: GameFrame) => {
          order.push('update');
          return frame;
        },
        afterUpdate: (frame: GameFrame) => {
          order.push('after');
          return frame;
        },
      });

      expect(order).toEqual(['before', 'update', 'after']);
    });

    it('should activate before first update', () => {
      const order: string[] = [];

      load({
        id: 'test.mod',
        activate: (frame: GameFrame) => {
          order.push('activate');
          return frame;
        },
        update: (frame: GameFrame) => {
          order.push('update');
          return frame;
        },
      });

      expect(order).toEqual(['activate', 'update']);
    });
  });

  describe('Execution ordering', () => {
    it('should respect loadAfter', () => {
      const order: string[] = [];
      const makeModule = (
        id: string,
        ordering?: Module['ordering']
      ): Module => ({
        id,
        ordering,
        update: (frame: GameFrame) => {
          order.push(id);
          return frame;
        },
      });

      const frame0 = gamePipe(makeFrame());
      const frame1 = Composer.pipe(
        ModuleManager.load(makeModule('b', { loadAfter: ['a'] })),
        ModuleManager.load(makeModule('a'))
      )(frame0);
      gamePipe(tick(frame1));

      expect(order).toEqual(['a', 'b']);
    });

    it('should respect loadBefore', () => {
      const order: string[] = [];
      const makeModule = (
        id: string,
        ordering?: Module['ordering']
      ): Module => ({
        id,
        ordering,
        update: (frame: GameFrame) => {
          order.push(id);
          return frame;
        },
      });

      const frame0 = gamePipe(makeFrame());
      const frame1 = Composer.pipe(
        ModuleManager.load(makeModule('a', { loadBefore: ['b'] })),
        ModuleManager.load(makeModule('b'))
      )(frame0);
      gamePipe(tick(frame1));

      expect(order).toEqual(['a', 'b']);
    });

    it('should handle transitive ordering', () => {
      const order: string[] = [];
      const makeModule = (
        id: string,
        ordering?: Module['ordering']
      ): Module => ({
        id,
        ordering,
        update: (frame: GameFrame) => {
          order.push(id);
          return frame;
        },
      });

      const frame0 = gamePipe(makeFrame());
      const frame1 = Composer.pipe(
        ModuleManager.load(makeModule('c', { loadAfter: ['b'] })),
        ModuleManager.load(makeModule('b', { loadAfter: ['a'] })),
        ModuleManager.load(makeModule('a'))
      )(frame0);
      gamePipe(tick(frame1));

      expect(order).toEqual(['a', 'b', 'c']);
    });

    it('should survive circular ordering gracefully', () => {
      const makeModule = (
        id: string,
        ordering?: Module['ordering']
      ): Module => ({
        id,
        ordering,
      });

      const frame0 = gamePipe(makeFrame());
      const frame1 = Composer.pipe(
        ModuleManager.load(makeModule('a', { loadAfter: ['b'] })),
        ModuleManager.load(makeModule('b', { loadAfter: ['a'] }))
      )(frame0);
      const frame2 = gamePipe(tick(frame1));

      expect(getOrder(frame2)).toHaveLength(2);
      expect(getOrder(frame2)).toContain('a');
      expect(getOrder(frame2)).toContain('b');
    });
  });
});
