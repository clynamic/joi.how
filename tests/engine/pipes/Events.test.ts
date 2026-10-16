import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Events } from '../../../src/engine/pipes/Events';
import { GameFrame } from '../../../src/engine/State';
import { makeFrame, tick } from '../../utils';

const pending = (frame: GameFrame) => frame?.core?.events?.pending ?? [];

describe('Events.define', () => {
  it('should namespace the event type', () => {
    expect(Events.define('test.plugin', 'ping').type).toBe('test.plugin/ping');
  });

  it('should dispatch with the payload', () => {
    const ping = Events.define<number>('test.plugin', 'ping');
    const frame = ping.dispatch(7)(makeFrame());

    expect(pending(frame)).toEqual([{ type: 'test.plugin/ping', payload: 7 }]);
  });

  it('should keep falsy payloads', () => {
    const ping = Events.define<number | boolean | null>('test.plugin', 'ping');
    const frame = Composer.pipe(
      ping.dispatch(0),
      ping.dispatch(false),
      ping.dispatch(null)
    )(makeFrame());

    expect(pending(frame).map((e: { payload: unknown }) => e.payload)).toEqual([
      0,
      false,
      null,
    ]);
  });

  it('should dispatch without a payload field when there is none', () => {
    const ping = Events.define('test.plugin', 'ping');
    const frame = ping.dispatch()(makeFrame());

    expect(pending(frame)).toStrictEqual([{ type: 'test.plugin/ping' }]);
  });

  it('should hand the typed payload to its handler on the next tick', () => {
    const ping = Events.define<number>('test.plugin', 'ping');
    const other = Events.define<number>('test.plugin', 'other');
    const seen: number[] = [];
    const watch = ping.handle(event => {
      seen.push(event.payload * 2);
      return frame => frame;
    });

    const frame0 = Composer.pipe(
      ping.dispatch(3),
      other.dispatch(99)
    )(makeFrame());
    expect(seen).toEqual([]);
    Composer.pipe(Events.pipe, watch)(tick(frame0));

    expect(seen).toEqual([6]);
  });
});
