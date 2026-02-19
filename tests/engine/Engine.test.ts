import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/engine/Engine';
import { GameFrame, Pipe } from '../../src/engine/State';

describe('GameEngine', () => {
  it('should initialize with given state', () => {
    const initial = { foo: 'bar' };
    const pipe: Pipe = frame => frame;
    const engine = new GameEngine(initial, pipe);

    expect(engine.getFrame().foo).toBe('bar');
  });

  it('should increment tick on each tick', () => {
    const engine = new GameEngine({}, frame => frame);

    engine.tick();
    expect(engine.getFrame().tick).toBe(1);

    engine.tick();
    expect(engine.getFrame().tick).toBe(2);
  });

  it('should accumulate time by fixed step', () => {
    const engine = new GameEngine({}, frame => frame);

    engine.tick();
    expect(engine.getFrame().time).toBe(16);

    engine.tick();
    expect(engine.getFrame().time).toBe(32);
  });

  it('should use default step of 16ms', () => {
    const engine = new GameEngine({}, frame => frame);

    engine.tick();
    expect(engine.getFrame().step).toBe(16);
  });

  it('should accept custom step size', () => {
    const engine = new GameEngine({}, frame => frame, { step: 8 });

    engine.tick();
    expect(engine.getFrame().step).toBe(8);
    expect(engine.getFrame().time).toBe(8);

    engine.tick();
    expect(engine.getFrame().time).toBe(16);
  });

  it('should pass data through pipe', () => {
    const pipe: Pipe = (frame: GameFrame) => ({
      ...frame,
      modified: true,
    });

    const engine = new GameEngine({}, pipe);
    engine.tick();

    expect(engine.getFrame().modified).toBe(true);
  });

  it('should produce new references per tick', () => {
    const pipe: Pipe = (frame: GameFrame) => ({
      ...frame,
      nested: { value: 42 },
    });

    const engine = new GameEngine({}, pipe);
    engine.tick();

    const frame1 = engine.getFrame();
    engine.tick();
    const frame2 = engine.getFrame();

    expect(frame1.nested).not.toBe(frame2.nested);
    expect(frame1.nested).toEqual(frame2.nested);
  });

  it('should freeze frame in dev mode', () => {
    const pipe: Pipe = (frame: GameFrame) => ({
      ...frame,
      nested: { value: 42 },
    });

    const engine = new GameEngine({}, pipe);
    engine.tick();

    const frame = engine.getFrame();
    expect(() => {
      frame.nested.value = 99;
    }).toThrow();
    expect(frame.nested.value).toBe(42);
  });
});
