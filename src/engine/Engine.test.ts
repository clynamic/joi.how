import { describe, it, expect } from 'vitest';
import { GameEngine } from './Engine';
import { GameFrame, Pipe } from './State';

describe('GameEngine', () => {
  it('should initialize with given state', () => {
    const initialState = { foo: 'bar' };
    const pipe: Pipe = frame => frame;
    const engine = new GameEngine(initialState, pipe);

    expect(engine.getState()).toEqual({ foo: 'bar' });
  });

  it('should increment tick on each tick', () => {
    const engine = new GameEngine({}, frame => frame);

    engine.tick(16);
    expect(engine.getContext().tick).toBe(1);

    engine.tick(16);
    expect(engine.getContext().tick).toBe(2);
  });

  it('should accumulate elapsed time', () => {
    const engine = new GameEngine({}, frame => frame);

    engine.tick(16);
    expect(engine.getContext().elapsedTime).toBe(16);

    engine.tick(20);
    expect(engine.getContext().elapsedTime).toBe(36);
  });

  it('should update deltaTime on each tick', () => {
    const engine = new GameEngine({}, frame => frame);

    engine.tick(16);
    expect(engine.getContext().deltaTime).toBe(16);

    engine.tick(33);
    expect(engine.getContext().deltaTime).toBe(33);
  });

  it('should pass state through pipe', () => {
    const pipe: Pipe = (frame: GameFrame) => ({
      ...frame,
      state: { ...frame.state, modified: true },
    });

    const engine = new GameEngine({}, pipe);
    engine.tick(16);

    expect(engine.getState()).toEqual({ modified: true });
  });

  it('should deep clone state after pipe execution', () => {
    const pipe: Pipe = (frame: GameFrame) => {
      const nested = { value: 42 };
      return {
        ...frame,
        state: { nested },
      };
    };

    const engine = new GameEngine({}, pipe);
    engine.tick(16);

    const state1 = engine.getState();
    engine.tick(16);
    const state2 = engine.getState();

    expect(state1.nested).not.toBe(state2.nested);
    expect(state1.nested).toEqual(state2.nested);
  });

  it('should deep clone context after pipe execution', () => {
    const pipe: Pipe = (frame: GameFrame) => ({
      ...frame,
      context: { ...frame.context, data: { value: 42 } },
    });

    const engine = new GameEngine({}, pipe);
    engine.tick(16);

    const ctx1 = engine.getContext();
    engine.tick(16);
    const ctx2 = engine.getContext();

    expect(ctx1.data).not.toBe(ctx2.data);
    expect(ctx1.data).toEqual(ctx2.data);
  });
});
