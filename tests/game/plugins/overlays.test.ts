import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { Module } from '../../../src/engine/modules/Module';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Fps from '../../../src/game/plugins/fps';
import PerfOverlay from '../../../src/game/plugins/perf';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

type Emitted = { type: string; payload?: unknown };

const getEffects = (frame: GameFrame, prefix: string): Emitted[] =>
  (frame?.core?.effects?.queue ?? []).filter((e: Emitted) =>
    e.type.startsWith(prefix)
  );

const setVisible = (visible: boolean): Pipe =>
  Composer.set(['core.debug', 'visible'], visible);

function load(module: Module): GameFrame {
  const frame0 = gamePipe(makeFrame());
  const frame1 = ModuleManager.load(module)(frame0);
  return gamePipe(tick(frame1));
}

function step(frame: GameFrame, impulse: Pipe = f => f): GameFrame {
  return withImpulse(impulse)(tick(frame));
}

describe('Fps', () => {
  const ID = 'core.fps';

  it('should emit show on every tick while debug is visible', () => {
    let frame = step(load(Fps), setVisible(true));
    const first = getEffects(frame, ID).map(e => e.type);
    frame = step(frame);
    const second = getEffects(frame, ID).map(e => e.type);

    expect(first).toEqual([`${ID}/show`]);
    expect(second).toEqual([`${ID}/show`]);
  });

  it('should emit hide once when debug turns off', () => {
    let frame = step(load(Fps), setVisible(true));
    frame = step(frame, setVisible(false));
    const onHide = getEffects(frame, ID).map(e => e.type);
    frame = step(frame);
    const after = getEffects(frame, ID).map(e => e.type);

    expect(onHide).toEqual([`${ID}/hide`]);
    expect(after).toEqual([]);
  });

  it('should emit nothing while hidden from the start', () => {
    const loaded = load(Fps);

    expect(getEffects(loaded, ID)).toEqual([]);
    expect(getEffects(step(loaded), ID)).toEqual([]);
  });

  it('should emit unmount while unloading', () => {
    const frame = step(load(Fps), ModuleManager.unload(ID));

    expect(getEffects(frame, ID).map(e => e.type)).toEqual([`${ID}/unmount`]);
    expect(frame.core.fps).toBeUndefined();
  });
});

describe('Fps performers', () => {
  const ID = 'core.fps';
  const element = () =>
    document.querySelector(`[data-plugin-id="${ID}"]`) as HTMLElement | null;
  const flush = (frame: GameFrame) => Effects.flush(frame, () => undefined);

  it('should mount and fill the overlay on show', () => {
    const frame = step(load(Fps), setVisible(true));
    flush(frame);

    expect(element()?.textContent).toMatch(/^\d+ FPS \/ \d+ TPS$/);
    expect(element()?.style.display).toBe('');
  });

  it('should hide the overlay on hide and remove it on unmount', () => {
    let frame = step(load(Fps), setVisible(true));
    flush(frame);
    frame = step(frame, setVisible(false));
    flush(frame);
    expect(element()?.style.display).toBe('none');

    frame = step(frame, ModuleManager.unload(ID));
    flush(frame);
    expect(element()).toBeNull();
  });
});

describe('PerfOverlay performers', () => {
  const ID = 'core.perf_overlay';
  const element = () =>
    document.querySelector(`[data-plugin-id="${ID}"]`) as HTMLElement | null;
  const flush = (frame: GameFrame) => Effects.flush(frame, () => undefined);

  it('should render one line per timed phase and a frame total', () => {
    const frame = step(
      load(PerfOverlay),
      Composer.pipe(
        setVisible(true),
        Composer.set(['core.perf'], {
          config: { pluginBudget: 2 },
          plugins: { core: { pace: { update: { avg: 0.5, lastTick: 1 } } } },
        })
      )
    );
    flush(frame);

    expect(element()?.textContent).toContain('core.pace');
    expect(element()?.textContent).toContain('0.50ms');
    expect(element()?.textContent).toContain('frame');

    flush(step(frame, ModuleManager.unload(ID)));
    expect(element()).toBeNull();
  });
});

describe('PerfOverlay', () => {
  const ID = 'core.perf_overlay';

  const perfData: Pipe = Composer.set(['core.perf'], {
    config: { pluginBudget: 2 },
    plugins: {
      core: {
        pace: { update: { avg: 0.5, lastTick: 1 } },
        perf_overlay: { update: { avg: 9, lastTick: 1 } },
      },
      'net.mod': { update: { avg: 1.25, lastTick: 1 } },
    },
  });

  it('should emit a view of every timed phase except its own', () => {
    const frame = step(
      load(PerfOverlay),
      Composer.pipe(setVisible(true), perfData)
    );

    const [effect] = getEffects(frame, ID);

    expect(effect.type).toBe(`${ID}/view`);
    expect(effect.payload).toEqual({
      budget: 2,
      rows: [
        { id: 'core.pace', phase: 'update', avg: 0.5 },
        { id: 'net.mod', phase: 'update', avg: 1.25 },
      ],
    });
  });

  it('should emit hide once when debug turns off', () => {
    let frame = step(load(PerfOverlay), setVisible(true));
    frame = step(frame, setVisible(false));
    const onHide = getEffects(frame, ID).map(e => e.type);
    frame = step(frame);
    const after = getEffects(frame, ID).map(e => e.type);

    expect(onHide).toEqual([`${ID}/hide`]);
    expect(after).toEqual([]);
  });

  it('should emit unmount while unloading', () => {
    const frame = step(load(PerfOverlay), ModuleManager.unload(ID));

    expect(getEffects(frame, ID).map(e => e.type)).toEqual([`${ID}/unmount`]);
    expect(frame.core.perf_overlay).toBeUndefined();
  });
});
