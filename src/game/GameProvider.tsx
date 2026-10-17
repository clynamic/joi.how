import { useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { createContext } from 'use-context-selector';
import { GameEngine, Pipe, GameFrame } from '../engine';
import { Effects } from '../engine/pipes/Effects';
import { Perf } from '../engine/pipes/Perf';
import { Piper } from '../engine/Piper';
import { Impulses } from '../engine/Impulses';
import { sdk } from '../engine/sdk';
import { gamePipes } from './pipes/Game';
import { ModuleManager } from '../engine/modules/ModuleManager';
import Debug from './plugins/debug';

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

    engineRef.current = new GameEngine({}, Piper(gamePipes(impulses, pipes)));

    const inject = (pipe: Pipe) => impulses.push(pipe);
    sdk.inject = inject;
    sdk.frame = () => engineRef.current?.getFrame() ?? null;
    const engineTypes = new Set(Effects.engineTypes());
    const observe = (owner: string, type: string, duration: number) => {
      if (engineTypes.has(type)) return;
      inject(Perf.record(owner, `perform ${type.split('/').pop()}`, duration));
    };

    const STEP = 16;
    const MAX_TICKS_PER_FRAME = 4;
    let speed = 1;
    impulses.push(
      ModuleManager.load({
        id: 'app.loop',
        effects: [
          Debug.speed.perform(({ factor }) => {
            speed = Number.isFinite(factor) && factor > 0 ? factor : 1;
          }),
        ],
      })
    );
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

      accumulator += (now - lastWallTime) * speed;
      lastWallTime = now;

      let ticked = false;
      let ticks = 0;
      const maxTicks = MAX_TICKS_PER_FRAME * speed;

      while (accumulator >= STEP && ticks < maxTicks) {
        ticked = true;
        Effects.flush(
          engineRef.current.tick(),
          inject,
          sdk.debug ? observe : undefined
        );
        accumulator -= STEP;
        ticks++;
      }

      if (ticks >= maxTicks) {
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
      sdk.inject = () => undefined;
      sdk.frame = () => null;
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
