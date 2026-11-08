import { lensFromPath, Path } from './Lens';
import { GameFrame } from './State';

export type FrameListener = (frame: GameFrame) => void;

export type WatchHost = {
  addController(controller: {
    hostConnected?(): void;
    hostDisconnected?(): void;
  }): void;
  requestUpdate(): void;
};

export type FrameWatch<T> = {
  readonly value: T | undefined;
  hostConnected(): void;
  hostDisconnected(): void;
};

const listeners = new Set<FrameListener>();

let current: GameFrame | null = null;

export const Frames = {
  get current(): GameFrame | null {
    return current;
  },

  subscribe(listener: FrameListener): () => void {
    listeners.add(listener);
    if (current) listener(current);
    return () => {
      listeners.delete(listener);
    };
  },

  watch<T>(host: WatchHost, path: Path<T>): FrameWatch<T> {
    const read = lensFromPath<GameFrame, T>(path).get;
    let unsubscribe: (() => void) | undefined;
    const watch: FrameWatch<T> & { value: T | undefined } = {
      value: undefined,
      hostConnected() {
        unsubscribe = Frames.subscribe(frame => {
          const next = read(frame);
          if (next === watch.value) return;
          watch.value = next;
          host.requestUpdate();
        });
      },
      hostDisconnected() {
        unsubscribe?.();
        unsubscribe = undefined;
      },
    };
    host.addController(watch);
    return watch;
  },

  publish(frame: GameFrame): void {
    current = frame;
    for (const listener of listeners) {
      try {
        listener(frame);
      } catch (error) {
        console.error(error);
      }
    }
  },

  reset(): void {
    current = null;
    listeners.clear();
  },
};
