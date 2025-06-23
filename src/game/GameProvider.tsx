import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { GameEngine, GameState, Pipe, GameContext } from '../engine';
import { actionPipeline } from '../engine/pipes/Action';

type GameEngineContextValue = {
  /**
   * The current state of the game engine.
   */
  state: GameState | null;
  /**
   * The current game context, which can be used to pass additional data to pipes.
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
   * Inject additional context into the game engine. Resets after each tick.
   */
  injectContext: (patch: Partial<GameContext>) => void;
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
  useBuildGameContext?: () => Partial<GameContext>;
};

export function GameEngineProvider({
  children,
  pipes = [],
  useBuildGameContext,
}: Props) {
  const engineRef = useRef<GameEngine | null>(null);
  const baseContextRef = useRef<Partial<GameContext>>({});
  const patchRef = useRef<Partial<GameContext>>({});
  const finalContextRef = useRef<Partial<GameContext>>({});

  const [state, setState] = useState<GameState | null>(null);
  const [context, setContext] = useState<GameContext | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const runningRef = useRef(true);
  const lastTimeRef = useRef<number | null>(null);

  baseContextRef.current = useBuildGameContext?.() || {};
  useEffect(() => {
    // To inject our custom context into the engine, we create this side-loading pipe.
    // This is idiomatic, because it does not require changing the game engine's internals.
    const contextInjector: Pipe = ({ state, context }) => {
      return {
        state,
        context: {
          ...context,
          ...finalContextRef.current,
        },
      };
    };

    engineRef.current = new GameEngine({}, [
      contextInjector,
      actionPipeline,
      ...pipes,
    ]);
    setState(engineRef.current.getState());
    setContext(engineRef.current.getContext());

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

      finalContextRef.current = {
        ...baseContextRef.current,
        ...patchRef.current,
      };

      patchRef.current = {};

      engineRef.current.tick(deltaTime);

      setState(engineRef.current.getState());
      setContext(engineRef.current.getContext());

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [pipes]);

  const pause = () => {
    runningRef.current = false;
    setIsRunning(false);
  };

  const resume = () => {
    runningRef.current = true;
    setIsRunning(true);
  };

  const injectContext = (patch: Partial<GameContext>) => {
    patchRef.current = { ...patchRef.current, ...patch };
  };

  return (
    <GameEngineContext.Provider
      value={{ state, context, pause, resume, isRunning, injectContext }}
    >
      {children}
    </GameEngineContext.Provider>
  );
}
