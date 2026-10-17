import { describe, it, expect, afterEach } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { sdk } from '../../../src/engine/sdk';
import Debug from '../../../src/game/plugins/debug';
import { makeFrame, makeGame, tick } from '../../utils';

const ID = 'core.debug';

const { pipe: gamePipe, withImpulse } = makeGame();

type Emitted = { type: string; payload?: unknown };
const getEffects = (frame: GameFrame): Emitted[] =>
  (frame?.core?.effects?.queue ?? []).filter((e: Emitted) =>
    e.type.startsWith(ID)
  );

const types = (frame: GameFrame): string[] =>
  (frame?.core?.effects?.queue ?? [])
    .map((e: { type: string }) => e.type)
    .filter((t: string) => t.startsWith(ID));

function load(): GameFrame {
  const frame0 = gamePipe(makeFrame());
  return gamePipe(tick(ModuleManager.load(Debug)(frame0)));
}

const pressF3 = () =>
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F3' }));

describe('Debug', () => {
  afterEach(() => {
    const frame = gamePipe(tick(ModuleManager.unload(ID)(load())));
    Effects.flush(frame, () => undefined);
    sdk.debug = false;
  });

  it('should start hidden and ask to listen', () => {
    const frame = load();

    expect(frame.core.debug).toEqual({ visible: false, speed: 1 });
    expect(sdk.debug).toBe(false);
    expect(types(frame)).toEqual([`${ID}/listen`]);
  });

  it('should flip visibility and the sdk flag on toggle', () => {
    const frame = Debug.toggle()(load());

    expect(frame.core.debug.visible).toBe(true);
    expect(sdk.debug).toBe(true);
    expect(Debug.toggle()(frame).core.debug.visible).toBe(false);
  });

  it('should inject a toggle when F3 is pressed after listening', () => {
    const frame = load();
    const injected: Pipe[] = [];
    Effects.flush(frame, pipe => injected.push(pipe));

    pressF3();

    expect(injected).toHaveLength(1);
    expect(injected[0](frame).core.debug.visible).toBe(true);
  });

  it('should ignore other keys', () => {
    const frame = load();
    const injected: Pipe[] = [];
    Effects.flush(frame, pipe => injected.push(pipe));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2' }));

    expect(injected).toEqual([]);
  });

  it('should double the speed on plus while visible, up to sixteen', () => {
    let frame = load();
    const injected: Pipe[] = [];
    Effects.flush(frame, pipe => injected.push(pipe));
    frame = gamePipe(tick(Debug.toggle()(frame)));
    const press = (key: string) =>
      window.dispatchEvent(new KeyboardEvent('keydown', { key }));

    const speeds: number[] = [];
    for (let i = 0; i < 6; i++) {
      injected.length = 0;
      press('+');
      frame = gamePipe(tick(Composer.pipe(...injected)(frame)));
      speeds.push(frame.core.debug.speed);
    }

    expect(speeds).toEqual([2, 4, 8, 16, 16, 16]);
  });

  it('should emit the new factor for the loop and halve on minus down to one', () => {
    let frame = gamePipe(tick(Debug.toggle()(load())));
    frame = withImpulse(Debug.setSpeed(4))(tick(frame));
    const raised = getEffects(frame);

    frame = withImpulse(Debug.slower())(tick(frame));
    frame = withImpulse(Debug.slower())(tick(frame));
    frame = withImpulse(Debug.slower())(tick(frame));
    const floored = getEffects(frame);

    expect(raised).toContainEqual({
      type: `${ID}/speed`,
      payload: { factor: 4 },
    });
    expect(frame.core.debug.speed).toBe(1);
    expect(floored).toEqual([]);
  });

  it('should leave the speed alone while hidden', () => {
    let frame = load();
    const injected: Pipe[] = [];
    Effects.flush(frame, pipe => injected.push(pipe));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '+' }));
    frame = gamePipe(tick(Composer.pipe(...injected)(frame)));

    expect(frame.core.debug.speed).toBe(1);
  });

  it('should put the loop back to normal speed on unload', () => {
    let frame = withImpulse(Debug.setSpeed(8))(tick(Debug.toggle()(load())));

    frame = gamePipe(tick(ModuleManager.unload(ID)(frame)));

    expect(getEffects(frame)).toContainEqual({
      type: `${ID}/speed`,
      payload: { factor: 1 },
    });
  });

  it('should stop listening after unload', () => {
    const frame = load();
    const injected: Pipe[] = [];
    Effects.flush(frame, pipe => injected.push(pipe));

    const unloaded = gamePipe(tick(ModuleManager.unload(ID)(frame)));
    expect(types(unloaded)).toEqual([`${ID}/unlisten`, `${ID}/speed`]);
    Effects.flush(unloaded, pipe => injected.push(pipe));
    injected.length = 0;

    pressF3();

    expect(injected).toEqual([]);
    expect(unloaded.core.debug).toBeUndefined();
  });
});
