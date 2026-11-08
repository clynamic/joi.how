import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Frames, WatchHost } from '../../src/engine/Frames';
import { makeFrame } from '../utils';

const makeHost = () => {
  const controllers: Parameters<WatchHost['addController']>[0][] = [];
  return {
    addController: (c: (typeof controllers)[number]) => {
      controllers.push(c);
    },
    requestUpdate: vi.fn(),
    connect: () => controllers.forEach(c => c.hostConnected?.()),
    disconnect: () => controllers.forEach(c => c.hostDisconnected?.()),
  };
};

describe('Frames', () => {
  beforeEach(() => Frames.reset());

  describe('subscribe', () => {
    it('should hand published frames to subscribers', () => {
      const listener = vi.fn();
      Frames.subscribe(listener);
      const frame = makeFrame({ a: 1 });

      Frames.publish(frame);

      expect(listener).toHaveBeenCalledWith(frame);
      expect(Frames.current).toBe(frame);
    });

    it('should hand the current frame to a late subscriber', () => {
      const frame = makeFrame({ a: 1 });
      Frames.publish(frame);
      const listener = vi.fn();

      Frames.subscribe(listener);

      expect(listener).toHaveBeenCalledWith(frame);
    });

    it('should stop calling a listener after unsubscribe', () => {
      const kept = vi.fn();
      const dropped = vi.fn();
      Frames.subscribe(kept);
      const unsubscribe = Frames.subscribe(dropped);

      unsubscribe();
      Frames.publish(makeFrame({ a: 1 }));

      expect(kept).toHaveBeenCalledTimes(1);
      expect(dropped).not.toHaveBeenCalled();
    });
  });

  describe('watch', () => {
    it('should read its slice and request an update when the slice changes', () => {
      const host = makeHost();
      const watch = Frames.watch<{ pace: number }>(host, ['plugin', 'state']);
      host.connect();

      Frames.publish(makeFrame({ plugin: { state: { pace: 2 } } }));

      expect(watch.value).toEqual({ pace: 2 });
      expect(host.requestUpdate).toHaveBeenCalledTimes(1);
    });

    it('should skip the update when the slice is the same object', () => {
      const host = makeHost();
      Frames.watch(host, ['plugin', 'state']);
      host.connect();
      const state = { pace: 2 };

      Frames.publish(makeFrame({ plugin: { state }, other: 1 }));
      Frames.publish(makeFrame({ plugin: { state }, other: 2 }));

      expect(host.requestUpdate).toHaveBeenCalledTimes(1);
    });

    it('should stop updating once the host disconnects', () => {
      const host = makeHost();
      Frames.watch(host, ['plugin', 'state']);
      host.connect();
      Frames.publish(makeFrame({ plugin: { state: 1 } }));

      host.disconnect();
      Frames.publish(makeFrame({ plugin: { state: 2 } }));

      expect(host.requestUpdate).toHaveBeenCalledTimes(1);
    });
  });
});
