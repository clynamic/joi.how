import { describe, it, expect, afterEach } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { sdk } from '../../../src/engine/sdk';
import Debug from '../../../src/game/plugins/debug';
import Keys from '../../../src/game/plugins/keys';
import { makeFrame, makeGame, tick } from '../../utils';

const ID = 'core.debug';

const { pipe: gamePipe, withImpulse } = makeGame();

type Emitted = { type: string; payload?: unknown };
const getEffects = (frame: GameFrame): Emitted[] =>
  (frame?.core?.effects?.queue ?? []).filter((e: Emitted) =>
    e.type.startsWith(ID)
  );

const press = (key: string) =>
  window.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));

function load(): { frame: GameFrame; injected: Pipe[] } {
  let frame = gamePipe(makeFrame());
  frame = Composer.pipe(
    ModuleManager.load(Keys),
    ModuleManager.load(Debug)
  )(frame);
  frame = gamePipe(tick(frame));
  const injected: Pipe[] = [];
  Effects.flush(frame, pipe => injected.push(pipe));
  return { frame, injected };
}

const apply = (frame: GameFrame, injected: Pipe[]): GameFrame => {
  const next = withImpulse(Composer.pipe(...injected))(tick(frame));
  injected.length = 0;
  return next;
};

describe('Debug', () => {
  afterEach(() => {
    const { frame } = load();
    const unloaded = gamePipe(
      tick(
        Composer.pipe(
          ModuleManager.unload(ID),
          ModuleManager.unload(Keys.id)
        )(frame)
      )
    );
    Effects.flush(unloaded, () => undefined);
    sdk.debug = false;
  });

  it('should start hidden at normal speed and capture F3', () => {
    let frame = gamePipe(makeFrame());
    frame = ModuleManager.load(Debug)(frame);
    frame = gamePipe(tick(frame));

    expect(frame.core.debug).toEqual({ visible: false, speed: 1 });
    expect(sdk.debug).toBe(false);
    expect(frame.core.effects.queue).toContainEqual({
      type: 'core.keys/capture',
      payload: { key: 'F3' },
    });
  });

  it('should flip visibility and the sdk flag on toggle', () => {
    const frame = Debug.toggle()(load().frame);

    expect(frame.core.debug.visible).toBe(true);
    expect(sdk.debug).toBe(true);
    expect(Debug.toggle()(frame).core.debug.visible).toBe(false);
  });

  it('should toggle on F3 and ignore other keys', () => {
    const { frame, injected } = load();

    press('F2');
    const untouched = apply(frame, injected);
    press('F3');
    const toggled = apply(untouched, injected);

    expect(untouched.core.debug.visible).toBe(false);
    expect(toggled.core.debug.visible).toBe(true);
  });

  it('should double the speed on plus while visible, up to sixteen', () => {
    const { frame: loaded, injected } = load();
    let frame = gamePipe(tick(Debug.toggle()(loaded)));

    const speeds: number[] = [];
    for (let i = 0; i < 6; i++) {
      press('+');
      frame = apply(frame, injected);
      speeds.push(frame.core.debug.speed);
    }

    expect(speeds).toEqual([2, 4, 8, 16, 16, 16]);
  });

  it('should emit the new factor for the loop and halve on minus down to one', () => {
    const { frame: loaded, injected } = load();
    let frame = gamePipe(tick(Debug.toggle()(loaded)));
    frame = withImpulse(Debug.setSpeed(4))(tick(frame));
    const raised = getEffects(frame);

    for (let i = 0; i < 3; i++) {
      press('-');
      frame = apply(frame, injected);
    }
    const floored = getEffects(frame);

    expect(raised).toContainEqual({
      type: `${ID}/speed`,
      payload: { factor: 4 },
    });
    expect(frame.core.debug.speed).toBe(1);
    expect(floored).toEqual([]);
  });

  it('should leave the speed alone while hidden', () => {
    const { frame, injected } = load();

    press('+');
    const next = apply(frame, injected);

    expect(next.core.debug.speed).toBe(1);
  });

  it('should put the loop back to normal speed when the overlay hides', () => {
    let frame = gamePipe(tick(Debug.toggle()(load().frame)));
    frame = withImpulse(Debug.setSpeed(8))(tick(frame));

    frame = withImpulse(Debug.toggle())(tick(frame));

    expect(frame.core.debug).toEqual({ visible: false, speed: 1 });
    expect(getEffects(frame)).toContainEqual({
      type: `${ID}/speed`,
      payload: { factor: 1 },
    });
  });

  it('should release F3 and put the loop back to normal speed on unload', () => {
    let frame = withImpulse(Debug.setSpeed(8))(
      tick(Debug.toggle()(load().frame))
    );

    frame = gamePipe(tick(ModuleManager.unload(ID)(frame)));

    expect(frame.core.effects.queue).toEqual(
      expect.arrayContaining([
        { type: 'core.keys/release', payload: { key: 'F3' } },
        { type: `${ID}/speed`, payload: { factor: 1 } },
      ])
    );
    expect(frame.core.debug).toBeUndefined();
  });
});
