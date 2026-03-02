import { describe, it, expect } from 'vitest';
import {
  ModuleManager,
  moduleManagerPipe,
} from '../../../src/engine/modules/ModuleManager';
import { Module } from '../../../src/engine/modules/Module';
import { Events } from '../../../src/engine/pipes/Events';
import { Composer } from '../../../src/engine/Composer';
import { Pipe, GameFrame } from '../../../src/engine/State';
import { makeFrame, tick } from '../../utils';

const gamePipe: Pipe = Composer.pipe(Events.pipe, moduleManagerPipe);

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
