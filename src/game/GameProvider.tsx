import { useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { createContext } from 'use-context-selector';
import { GameEngine, Pipe, GameFrame } from '../engine';
import { Effects } from '../engine/pipes/Effects';
import { Events } from '../engine/pipes/Events';
import { Scheduler } from '../engine/pipes/Scheduler';
import { Perf } from '../engine/pipes/Perf';
import { Errors } from '../engine/pipes/Errors';
import { Piper } from '../engine/Piper';
import { Impulses } from '../engine/Impulses';
import { sdk } from '../engine/sdk';

type GameEngineContextValue = {
  /**
   * The current game frame containing all plugin data and timing.
   */
  frame: GameFrame | null;
  /**
   * Queue a one-shot pipe to run in the next tick only.
   */
  injectImpulse: (pipe: Pipe) => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export const GameEngineContext = createContext<
  GameEngineContextValue | undefined
>(undefined);

type Props = {
  children: ReactNode;
  pipes?: Pipe[];
};

export function GameEngineProvider({ children, pipes = [] }: Props) {
  const engineRef = useRef<GameEngine | null>(null);

  const [frame, setFrame] = useState<GameFrame | null>(null);

  const impulsesRef = useRef(new Impulses());

  useEffect(() => {
    const impulses = impulsesRef.current;

    engineRef.current = new GameEngine(
      {},
      Piper([
        Effects.pipe,
        impulses.pipe,
        Events.pipe,
        Scheduler.pipe,
        Perf.pipe,
        Errors.pipe,
        ...pipes,
      ])
    );

    const inject = (pipe: Pipe) => impulses.push(pipe);
    const observe = (owner: string, type: string, duration: number) =>
      inject(Perf.record(owner, `perform ${type.split('/').pop()}`, duration));

    const STEP = 16;
    const MAX_TICKS_PER_FRAME = 4;
    let accumulator = 0;
    let lastWallTime: number | null = null;
    let frameId: number;

    const loop = () => {
      if (!engineRef.current) return;

      const now = performance.now();

      if (document.hidden || lastWallTime === null) {
        lastWallTime = now;
        frameId = requestAnimationFrame(loop);
        return;
      }

      accumulator += now - lastWallTime;
      lastWallTime = now;

      let ticked = false;
      let ticks = 0;

      while (accumulator >= STEP && ticks < MAX_TICKS_PER_FRAME) {
        ticked = true;
        Effects.flush(
          engineRef.current.tick(),
          inject,
          sdk.debug ? observe : undefined
        );
        accumulator -= STEP;
        ticks++;
      }

      if (ticks >= MAX_TICKS_PER_FRAME) {
        accumulator = 0;
      }

      if (ticked) {
        setFrame(engineRef.current.getFrame());
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
      engineRef.current = null;
      impulses.clear();
    };
  }, [pipes]);

  const injectImpulse = useCallback((pipe: Pipe) => {
    impulsesRef.current.push(pipe);
  }, []);

  return (
    <GameEngineContext.Provider value={{ frame, injectImpulse }}>
      {children}
    </GameEngineContext.Provider>
  );
}
