import { describe, it, expect, afterEach } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { Events } from '../../../src/engine/pipes/Events';
import {
  ModuleManager,
  moduleManagerPipe,
} from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { sdk } from '../../../src/engine/sdk';
import Debug from '../../../src/game/plugins/debug';
import { makeFrame, tick } from '../../utils';

const ID = 'core.debug';

const gamePipe: Pipe = Composer.pipe(
  Effects.pipe,
  Events.pipe,
  moduleManagerPipe
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

    expect(frame.core.debug).toEqual({ visible: false });
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

  it('should stop listening after unload', () => {
    const frame = load();
    const injected: Pipe[] = [];
    Effects.flush(frame, pipe => injected.push(pipe));

    const unloaded = gamePipe(tick(ModuleManager.unload(ID)(frame)));
    expect(types(unloaded)).toEqual([`${ID}/unlisten`]);
    Effects.flush(unloaded, pipe => injected.push(pipe));

    pressF3();

    expect(injected).toEqual([]);
    expect(unloaded.core.debug).toBeUndefined();
  });
});
