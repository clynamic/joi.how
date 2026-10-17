import { describe, it, expect, afterEach } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Keys from '../../../src/game/plugins/keys';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

const seen = (frame: GameFrame): string[] => frame.seen ?? [];
const record = (label: string): Pipe =>
  Composer.over(['seen'], (list: string[]) => [...list, label], []);

const watcher = {
  id: 'test.watch',
  update: Composer.pipe(
    Keys.onKey('Escape', () => record('escape')),
    Keys.onKey(['+', '='], press => record(`plus${press.shift ? '!' : ''}`)),
    Keys.onKey('r', () => record('r'), { repeat: true }),
    Keys.onKey('m', () => record('m'), { modified: true })
  ),
};

const press = (key: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', {
    key,
    cancelable: true,
    ...init,
  });
  window.dispatchEvent(event);
  return event;
};

function flush(frame: GameFrame): GameFrame {
  const injected: Pipe[] = [];
  Effects.flush(frame, pipe => injected.push(pipe));
  return withImpulse(Composer.pipe(...injected))(tick(frame));
}

function listening(): { frame: GameFrame; injected: Pipe[] } {
  let frame = gamePipe(makeFrame());
  frame = Composer.pipe(
    ModuleManager.load(Keys),
    ModuleManager.load(watcher)
  )(frame);
  frame = gamePipe(tick(frame));
  const injected: Pipe[] = [];
  Effects.flush(frame, pipe => injected.push(pipe));
  return { frame, injected };
}

describe('Keys', () => {
  afterEach(() => {
    const frame = gamePipe(
      tick(ModuleManager.unload(Keys.id)(listening().frame))
    );
    Effects.flush(frame, () => undefined);
  });

  it('should hand a key press to the handlers of that key', () => {
    const { frame, injected } = listening();

    press('Escape');
    press('=', { shiftKey: true });
    press('x');
    const next = withImpulse(Composer.pipe(...injected))(tick(frame));

    expect(seen(next)).toEqual(['escape', 'plus!']);
  });

  it('should ignore held keys and chords unless the handler asks for them', () => {
    const { frame, injected } = listening();

    press('Escape', { repeat: true });
    press('Escape', { ctrlKey: true });
    press('Escape', { altKey: true });
    press('Escape', { metaKey: true });
    press('r', { repeat: true });
    press('m', { ctrlKey: true });
    press('Escape');
    const next = withImpulse(Composer.pipe(...injected))(tick(frame));

    expect(seen(next)).toEqual(['escape', 'r', 'm']);
  });

  it('should keep a key captured until every capture is released', () => {
    let frame = withImpulse(
      Composer.pipe(Keys.capture('F3'), Keys.capture('F3'))
    )(tick(listening().frame));
    flush(frame);
    frame = withImpulse(Keys.release('F3'))(tick(frame));
    flush(frame);
    const once = press('F3');

    frame = withImpulse(Keys.release('F3'))(tick(frame));
    flush(frame);
    const twice = press('F3');

    expect(once.defaultPrevented).toBe(true);
    expect(twice.defaultPrevented).toBe(false);
  });

  it('should keep captures across a reload of the listener', () => {
    let frame = withImpulse(Keys.capture('F3'))(tick(listening().frame));
    flush(frame);
    frame = gamePipe(tick(ModuleManager.reload(Keys.id)(frame)));
    for (let i = 0; i < 3; i++) frame = flush(frame);

    const f3 = press('F3');

    expect(f3.defaultPrevented).toBe(true);
  });

  it('should prevent the browser default only for captured keys', () => {
    const armed = withImpulse(Keys.capture('F3'))(tick(listening().frame));
    flush(armed);

    const f3 = press('F3');
    const other = press('F2');

    expect(f3.defaultPrevented).toBe(true);
    expect(other.defaultPrevented).toBe(false);
  });

  it('should stop listening after unload', () => {
    const { frame, injected } = listening();
    const unloaded = gamePipe(tick(ModuleManager.unload(Keys.id)(frame)));
    Effects.flush(unloaded, () => undefined);
    injected.length = 0;

    press('Escape');

    expect(injected).toEqual([]);
  });
});
