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

    engine.tick();
    expect(engine.getContext().tick).toBe(1);

    engine.tick();
    expect(engine.getContext().tick).toBe(2);
  });

  it('should accumulate time by fixed step', () => {
    const engine = new GameEngine({}, frame => frame);

    engine.tick();
    expect(engine.getContext().time).toBe(16);

    engine.tick();
    expect(engine.getContext().time).toBe(32);
  });

  it('should use default step of 16ms', () => {
    const engine = new GameEngine({}, frame => frame);

    engine.tick();
    expect(engine.getContext().step).toBe(16);
  });

  it('should accept custom step size', () => {
    const engine = new GameEngine({}, frame => frame, { step: 8 });

    engine.tick();
    expect(engine.getContext().step).toBe(8);
    expect(engine.getContext().time).toBe(8);

    engine.tick();
    expect(engine.getContext().time).toBe(16);
  });

  it('should pass state through pipe', () => {
    const pipe: Pipe = (frame: GameFrame) => ({
      ...frame,
      state: { ...frame.state, modified: true },
    });

    const engine = new GameEngine({}, pipe);
    engine.tick();

    expect(engine.getState()).toEqual({ modified: true });
  });

  it('should produce new state references per tick', () => {
    const pipe: Pipe = (frame: GameFrame) => ({
      ...frame,
      state: { ...frame.state, nested: { value: 42 } },
    });

    const engine = new GameEngine({}, pipe);
    engine.tick();

    const state1 = engine.getState();
    engine.tick();
    const state2 = engine.getState();

    expect(state1.nested).not.toBe(state2.nested);
    expect(state1.nested).toEqual(state2.nested);
  });

  it('should freeze state in dev mode', () => {
    const pipe: Pipe = (frame: GameFrame) => ({
      ...frame,
      state: { ...frame.state, nested: { value: 42 } },
    });

    const engine = new GameEngine({}, pipe);
    engine.tick();

    const state = engine.getState();
    expect(() => {
      state.nested.value = 99;
    }).toThrow();
    expect(state.nested.value).toBe(42);
  });
});
