import { useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { createContext } from 'use-context-selector';
import { GameEngine, GameState, Pipe, GameContext } from '../engine';
import { Events } from '../engine/pipes/Events';
import { schedulerPipe } from '../engine/pipes/Scheduler';
import { perfPipe } from '../engine/pipes/Perf';
import { Piper } from '../engine/Piper';
import { Composer } from '../engine/Composer';

type GameEngineContextValue = {
  /**
   * The current state of the game engine.
   */
  state: GameState | null;
  /**
   * The current game context which contains inter-pipe data and debugging information.
   */
  context: GameContext | null;
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
  const lastTimeRef = useRef<number | null>(null);

  const [state, setState] = useState<GameState | null>(null);
  const [context, setContext] = useState<GameContext | null>(null);

  const pendingImpulseRef = useRef<Pipe[]>([]);
  const activeImpulseRef = useRef<Pipe[]>([]);

  useEffect(() => {
    // To inject one-shot pipes (impulses) into the engine,
    // we use the pending ref to stage them, and the active ref to apply them.
    const impulsePipe: Pipe = Composer.chain(c =>
      c.pipe(...activeImpulseRef.current)
    );

    engineRef.current = new GameEngine(
      {},
      Piper([impulsePipe, Events.pipe, schedulerPipe, perfPipe, ...pipes])
    );

    let frameId: number;

    const loop = (time: number) => {
      if (!engineRef.current) return;

      if (document.hidden) {
        lastTimeRef.current = null;
        frameId = requestAnimationFrame(loop);
        return;
      }

      if (lastTimeRef.current == null) {
        lastTimeRef.current = time;
        frameId = requestAnimationFrame(loop);
        return;
      }

      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      activeImpulseRef.current = pendingImpulseRef.current;
      pendingImpulseRef.current = [];

      engineRef.current.tick(deltaTime);

      setState(engineRef.current.getState());
      setContext(engineRef.current.getContext());

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
      lastTimeRef.current = null;
      engineRef.current = null;
      pendingImpulseRef.current = [];
      activeImpulseRef.current = [];
    };
  }, [pipes]);

  const injectImpulse = useCallback((pipe: Pipe) => {
    pendingImpulseRef.current.push(pipe);
  }, []);

  return (
    <GameEngineContext.Provider value={{ state, context, injectImpulse }}>
      {children}
    </GameEngineContext.Provider>
  );
}
