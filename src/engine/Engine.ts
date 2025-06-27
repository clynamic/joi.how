import { GameState, GameContext, Pipe, GameTiming, GameFrame } from './State';
import cloneDeep from 'lodash/cloneDeep';

export class GameEngine {
  constructor(initial: GameState, pipe: Pipe) {
    this.state = { ...initial };
    this.pipe = pipe;
    this.timing = {
      tick: 0,
      deltaTime: 0,
      elapsedTime: 0,
    };
    this.context = this.timing;
  }

  /**
   * The state of the engine. This object should contain all information to run the game from a cold start.
   *
   * Pipes may add any additional fields.
   */
  private state: GameState;

  /**
   * The pipe is a function that produces a new game frame based on the current game frame.
   */
  private pipe: Pipe;

  /**
   * The context of the engine. May contain any ephemeral information of any plugin, however it is to be noted;
   * Context may be discarded at any time, so it may not contain information necessary to restore the game state.
   * As such, this object can contain inter-pipe communication, utility functions, or debugging information.
   */
  private context: GameContext;

  /**
   * Contains the timing information of the game engine. This may not be modified by either the outside nor by pipes.
   */
  private timing: GameTiming;

  /**
   * Returns the current game state.
   */
  public getState(): GameState {
    return this.state;
  }

  /**
   * Returns the current game context.
   */
  public getContext(): GameContext {
    return {
      ...this.context,
      ...this.timing,
    };
  }

  /**
   * Runs the game engine for a single tick, passing the delta time since the last tick.
   */
  public tick(deltaTime: number): GameState {
    this.timing.tick += 1;
    this.timing.deltaTime = deltaTime;
    this.timing.elapsedTime += deltaTime;

    const frame: GameFrame = {
      state: this.state,
      context: {
        ...this.context,
        ...this.timing,
      },
    };

    const result = this.pipe(frame);

    this.state = cloneDeep(result.state);
    this.context = cloneDeep({
      ...result.context,
      ...this.timing,
    });

    return this.state;
  }
}
