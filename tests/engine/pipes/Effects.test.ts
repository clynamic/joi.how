import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects, type Inject } from '../../../src/engine/pipes/Effects';
import { Log } from '../../../src/engine/pipes/Log';
import { Events } from '../../../src/engine/pipes/Events';
import {
  ModuleManager,
  moduleManagerPipe,
} from '../../../src/engine/modules/ModuleManager';
import { Module } from '../../../src/engine/modules/Module';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { lensFromPath } from '../../../src/engine/Lens';
import { makeFrame, tick } from '../../utils';

const basePipe: Pipe = Composer.pipe(
  Effects.pipe,
  Events.pipe,
  moduleManagerPipe
);

const getQueue = (frame: GameFrame): unknown[] =>
  lensFromPath(['core.effects', 'queue']).get(frame) ?? [];

function load(...modules: Module[]): GameFrame {
  const frame0 = basePipe(makeFrame());
  const frame1 = Composer.pipe(...modules.map(ModuleManager.load))(frame0);
  return basePipe(tick(frame1));
}

const noInject: Inject = () => undefined;

describe('Effects', () => {
  beforeEach(() => {
    Log.clear();
  });

  describe('define', () => {
    it('should namespace the effect type', () => {
      const ping = Effects.define('test.plugin', 'ping');

      expect(ping.type).toBe('test.plugin/ping');
    });
  });

  describe('emit', () => {
    it('should append to the queue in order', () => {
      const ping = Effects.define<number>('test.plugin', 'ping');
      const frame = Composer.pipe(
        basePipe,
        ping.emit(1),
        ping.emit(2)
      )(makeFrame());

      expect(getQueue(frame)).toEqual([
        { type: 'test.plugin/ping', payload: 1 },
        { type: 'test.plugin/ping', payload: 2 },
      ]);
    });

    it('should leave the rest of the frame untouched', () => {
      const ping = Effects.define('test.plugin', 'ping');
      const frame = basePipe(makeFrame({ other: { value: 1 } }));

      const result = ping.emit()(frame);

      expect(result.other).toBe(frame.other);
    });
  });

  describe('pipe', () => {
    it('should clear the queue at the start of a tick', () => {
      const ping = Effects.define('test.plugin', 'ping');
      const frame0 = Composer.pipe(basePipe, ping.emit())(makeFrame());
      expect(getQueue(frame0)).toHaveLength(1);

      const frame1 = basePipe(tick(frame0));

      expect(getQueue(frame1)).toEqual([]);
    });
  });

  describe('flush', () => {
    it('should call performers in queue order with their payload', () => {
      const ping = Effects.define<number>('test.a', 'ping');
      const pong = Effects.define<string>('test.b', 'pong');
      const seen: unknown[] = [];

      const frame = load(
        { id: 'test.a', effects: [ping.perform(n => seen.push(n))] },
        { id: 'test.b', effects: [pong.perform(s => seen.push(s))] }
      );
      const queued = Composer.pipe(
        ping.emit(1),
        pong.emit('x'),
        ping.emit(2)
      )(frame);

      Effects.flush(queued, noInject);

      expect(seen).toEqual([1, 'x', 2]);
    });

    it('should hand inject to performers', () => {
      const ping = Effects.define('test.plugin', 'ping');
      const reply: Pipe = f => f;
      const inject = vi.fn();

      const frame = load({
        id: 'test.plugin',
        effects: [ping.perform((_, inject) => inject(reply))],
      });

      Effects.flush(ping.emit()(frame), inject);

      expect(inject).toHaveBeenCalledWith(reply);
    });

    it('should not touch the frame', () => {
      const ping = Effects.define('test.plugin', 'ping');
      const frame = ping.emit()(
        load({ id: 'test.plugin', effects: [ping.perform(() => undefined)] })
      );
      const before = JSON.stringify(frame);

      Effects.flush(frame, noInject);

      expect(JSON.stringify(frame)).toBe(before);
    });

    it('should skip effects nothing performs and keep going', () => {
      const known = Effects.define('test.plugin', 'known');
      const unknown = Effects.define('test.plugin', 'unknown');
      const seen: string[] = [];
      const injected: Pipe[] = [];

      const frame = load({
        id: 'test.plugin',
        effects: [known.perform(() => seen.push('known'))],
      });

      Effects.flush(Composer.pipe(unknown.emit(), known.emit())(frame), pipe =>
        injected.push(pipe)
      );

      expect(seen).toEqual(['known']);
      expect(injected).toHaveLength(1);
      const reported = Composer.pipe(Effects.pipe, ...injected)(frame);
      expect(reported.core.effects.queue[0].payload).toMatchObject({
        level: 'warn',
        source: 'core.effects',
        data: { type: 'test.plugin/unknown' },
      });
    });

    it('should survive a performer that throws and log it next tick', () => {
      const boom = Effects.define('test.plugin', 'boom');
      const after = Effects.define('test.plugin', 'after');
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const seen: string[] = [];
      const injected: Pipe[] = [];

      const frame = load({
        id: 'test.plugin',
        effects: [
          boom.perform(() => {
            throw new Error('nope');
          }),
          after.perform(() => seen.push('after')),
        ],
      });

      expect(() =>
        Effects.flush(Composer.pipe(boom.emit(), after.emit())(frame), pipe =>
          injected.push(pipe)
        )
      ).not.toThrow();
      expect(seen).toEqual(['after']);

      const next = Composer.pipe(
        Effects.pipe,
        ...injected,
        Events.pipe
      )(tick(frame));
      Effects.flush(next, noInject);

      expect(Log.entries().at(-1)).toMatchObject({
        level: 'error',
        source: 'test.plugin',
        message: 'effect {type} failed: {error}',
        data: { type: 'test.plugin/boom', error: 'Error: nope' },
      });
      expect(error).toHaveBeenCalledTimes(1);
      error.mockRestore();
    });

    it('should work with plain objects and no helpers', () => {
      const seen: unknown[] = [];

      const frame = load({
        id: 'test.raw',
        effects: [
          { type: 'test.raw/ping', perform: payload => seen.push(payload) },
        ],
      });
      const queued = Composer.over(
        ['core.effects', 'queue'],
        (queue: unknown[]) => [...queue, { type: 'test.raw/ping', payload: 7 }],
        []
      )(frame);

      Effects.flush(queued, noInject);

      expect(seen).toEqual([7]);
    });

    it('should perform what a module emits while it unloads', () => {
      const bye = Effects.define('test.plugin', 'bye');
      const seen: string[] = [];

      const frame = load({
        id: 'test.plugin',
        deactivate: bye.emit(),
        effects: [bye.perform(() => seen.push('bye'))],
      });
      const unloaded = basePipe(
        tick(ModuleManager.unload('test.plugin')(frame))
      );

      Effects.flush(unloaded, noInject);

      expect(seen).toEqual(['bye']);
      expect(getQueue(basePipe(tick(unloaded)))).toEqual([]);
    });

    it('should keep the first owner of a duplicated effect type', () => {
      const ping = Effects.define('test.plugin', 'ping');
      const seen: string[] = [];

      const frame = load(
        { id: 'test.a', effects: [ping.perform(() => seen.push('a'))] },
        { id: 'test.b', effects: [ping.perform(() => seen.push('b'))] }
      );

      expect(() => Effects.flush(ping.emit()(frame), noInject)).not.toThrow();
      expect(seen).toEqual(['a']);
    });

    it('should forget a retired performer after the next tick', () => {
      const bye = Effects.define('test.plugin', 'bye');
      const seen: string[] = [];
      const injected: Pipe[] = [];

      const frame = load({
        id: 'test.plugin',
        effects: [bye.perform(() => seen.push('bye'))],
      });
      const unloaded = basePipe(
        tick(ModuleManager.unload('test.plugin')(frame))
      );
      const later = basePipe(tick(unloaded));

      Effects.flush(bye.emit()(later), pipe => injected.push(pipe));

      expect(seen).toEqual([]);
      expect(injected).toHaveLength(1);
    });
  });
});
