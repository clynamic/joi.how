import { GameState, GameContext, Pipe, GameTiming } from './State';
import cloneDeep from 'lodash/cloneDeep';

export class GameEngine {
  constructor(initial: Partial<GameState>, pipes: Pipe[]) {
    this.state = { ...initial };
    this.pipes = pipes;
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
   * Engine pipes transform the game state and context by accepting the current state and context, and returning a new state and context.
   */
  private pipes: Pipe[];

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

    let state = this.state;
    let context = this.context;

    const buildContext = (): GameContext => ({
      ...context,
      ...this.timing,
    });

    for (const pipe of this.pipes) {
      try {
        ({ state, context } = pipe({ state, context: buildContext() }));
      } catch (err) {
        // TODO: add debug info wrapper to pipe functions so they can be traced back to plugins
        console.error('Pipe error:', err);
      }
    }

    this.state = cloneDeep(state);
    this.context = cloneDeep(buildContext());

    return this.state;
  }
}
