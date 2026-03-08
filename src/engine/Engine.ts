import { Pipe, GameTiming, GameFrame } from './State';
import { deepFreeze } from './freeze';

export type GameEngineOptions = {
  step?: number;
};

export class GameEngine {
  constructor(
    initial: Record<string, any>,
    pipe: Pipe,
    options?: GameEngineOptions
  ) {
    this.frame = { ...initial } as GameFrame;
    this.pipe = pipe;
    this.step = options?.step ?? 16;
    this.timing = {
      tick: 0,
      step: this.step,
      time: 0,
    };
  }

  /**
   * The frame contains all plugin data. Each plugin's data lives at frame[pluginId].
   */
  private frame: GameFrame;

  /**
   * The pipe is a function that produces a new game frame based on the current game frame.
   */
  private pipe: Pipe;

  /**
   * The fixed time step per tick in milliseconds.
   */
  private step: number;

  /**
   * Contains the timing information of the game engine. This may not be modified by either the outside nor by pipes.
   */
  private timing: GameTiming;

  /**
   * Returns the current game frame.
   */
  public getFrame(): GameFrame {
    return {
      ...this.frame,
      ...this.timing,
    };
  }

  /**
   * Runs the game engine for a single fixed-step tick.
   */
  public tick(): GameFrame {
    this.timing.tick += 1;
    this.timing.time += this.step;

    const frame: GameFrame = {
      ...this.frame,
      ...this.timing,
    };

    const result = this.pipe(frame);

    this.frame = {
      ...result,
      ...this.timing,
    };

    if (import.meta.env.DEV) deepFreeze(this.frame);

    return this.frame;
  }
}
