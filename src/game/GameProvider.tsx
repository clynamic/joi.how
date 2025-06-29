import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { GameEngine, GameState, Pipe, GameContext } from '../engine';
import { eventPipe } from '../engine/pipes/Events';
import { schedulerPipe } from '../engine/pipes/Scheduler';
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
   * Hard pause the game engine, stopping all updates and rendering.
   */
  pause: () => void;
  /**
   * Resume the game engine after a pause.
   */
  resume: () => void;
  /**
   * Whether the game engine is currently running.
   */
  isRunning: boolean;
  /**
   * Queue a one-shot pipe to run in the next tick only.
   */
  injectImpulse: (pipe: Pipe) => void;
};

const GameEngineContext = createContext<GameEngineContextValue | undefined>(
  undefined
);

export function useGameEngine() {
  const ctx = useContext(GameEngineContext);
  if (!ctx)
    throw new Error('useGameEngine must be used inside GameEngineProvider');
  return ctx;
}

type Props = {
  children: ReactNode;
  pipes?: Pipe[];
};

export function GameEngineProvider({ children, pipes = [] }: Props) {
  const engineRef = useRef<GameEngine | null>(null);
  const runningRef = useRef(true);
  const lastTimeRef = useRef<number | null>(null);

  const [state, setState] = useState<GameState | null>(null);
  const [context, setContext] = useState<GameContext | null>(null);
  const [isRunning, setIsRunning] = useState(runningRef.current);

  const pendingImpulseRef = useRef<Pipe[]>([]);
  const activeImpulseRef = useRef<Pipe[]>([]);

  useEffect(() => {
    runningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    // To inject one-shot pipes (impulses) into the engine,
    // we use the pending ref to stage them, and the active ref to apply them.
    const impulsePipe: Pipe = Composer.chain(c =>
      c.pipe(...activeImpulseRef.current)
    );

    engineRef.current = new GameEngine(
      {},
      Piper([impulsePipe, eventPipe, schedulerPipe, ...pipes])
    );

    let frameId: number;

    const loop = (time: number) => {
      if (!engineRef.current) return;

      // When paused, we advance time but do not tick.
      // This prevents incorrectly accumulating delta time during pauses.
      if (lastTimeRef.current == null || !runningRef.current) {
        lastTimeRef.current = time;
        frameId = requestAnimationFrame(loop);
        return;
      }

      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // activate pending impulses
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

  const pause = () => setIsRunning(false);

  const resume = () => setIsRunning(true);

  const injectImpulse = (pipe: Pipe) => {
    pendingImpulseRef.current.push(pipe);
  };

  return (
    <GameEngineContext.Provider
      value={{ state, context, pause, resume, isRunning, injectImpulse }}
    >
      {children}
    </GameEngineContext.Provider>
  );
}
