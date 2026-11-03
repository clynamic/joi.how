import { describe, it, expect, beforeEach } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Storage from '../../../src/engine/plugins/Storage';
import Settings from '../../../src/game/plugins/settings';
import Presets from '../../../src/game/plugins/presets';
import pkg from '../../../package.json';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

const prefs = Settings.keys('test.prefs', { volume: 0.5, loud: false });
const game = Presets.keys('how.joi.classic.pace', { minPace: 1, maxPace: 5 });

const prefsDoc = (values: object) => ({ 'test.prefs': values });
const paceDoc = (values: object) => ({ 'how.joi.classic.pace': values });

const file = (data: unknown) =>
  JSON.stringify({ version: pkg.version, savedAt: 1, data });

const storedData = (key: string) =>
  JSON.parse(localStorage.getItem(key) ?? 'null')?.data ?? null;

function step(frame: GameFrame, impulse: Pipe = f => f): GameFrame {
  const injected: Pipe[] = [];
  Effects.flush(frame, pipe => injected.push(pipe));
  return withImpulse(Composer.pipe(...injected, impulse))(tick(frame));
}

function settle(frame: GameFrame, times = 4): GameFrame {
  for (let i = 0; i < times; i++) frame = step(frame);
  return frame;
}

function boot(settleTicks = 4): GameFrame {
  let frame = gamePipe(makeFrame());
  for (const plugin of [Storage, Settings, Presets]) {
    frame = ModuleManager.load(plugin)(frame);
  }
  frame = gamePipe(tick(frame));
  return settle(frame, settleTicks);
}

describe('document plugins', () => {
  beforeEach(() => localStorage.clear());

  it('should fill declared keys from defaults until the slot loads', () => {
    localStorage.setItem(
      'how.joi.settings.default',
      file(prefsDoc({ volume: 0.9 }))
    );
    const early = boot(0);
    const loaded = settle(early);

    expect(prefs.get(early)).toEqual({ volume: 0.5, loud: false });
    expect(prefs.get(loaded)).toEqual({ volume: 0.9, loud: false });
    expect(Settings.read(loaded, 'test.prefs', 'volume', 0)).toBe(0.9);
    expect(Settings.read(loaded, 'test.prefs', 'absent', 7)).toBe(7);
  });

  it('should keep a write made before the slot loads', () => {
    localStorage.setItem(
      'how.joi.settings.default',
      file(prefsDoc({ volume: 0.9 }))
    );
    let frame = step(boot(1), prefs.set('loud', true));
    expect(prefs.get(frame)).toEqual({ volume: 0.9, loud: true });
    expect(storedData('how.joi.settings.default')).toEqual(
      prefsDoc({ volume: 0.9 })
    );
    frame = settle(frame);

    expect(prefs.get(frame)).toEqual({ volume: 0.9, loud: true });
    expect(storedData('how.joi.settings.default')).toEqual(
      prefsDoc({ volume: 0.9, loud: true })
    );

    frame = step(frame, prefs.set('volume', 0.2));
    frame = settle(frame);
    expect(storedData('how.joi.settings.default')).toEqual(
      prefsDoc({ volume: 0.2, loud: true })
    );
  });

  it('should keep the keys of different plugins apart', () => {
    const first = Presets.keys('me.first', { speed: 1 });
    const second = Presets.keys('me.second', { speed: 1 });
    let frame = step(boot(), first.set('speed', 3));
    frame = settle(frame);

    expect(first.get(frame)).toEqual({ speed: 3 });
    expect(second.get(frame)).toEqual({ speed: 1 });
    expect(storedData('how.joi.presets.default')).toEqual({
      'me.first': { speed: 3 },
    });
  });

  it('should move the legacy fields into the sections of their plugins', () => {
    localStorage.setItem(
      'settings',
      JSON.stringify({ minPace: 3, highRes: true, volume: 1 })
    );
    localStorage.setItem('home', JSON.stringify({ ageCheckConfirm: true }));
    const frame = boot(6);

    expect(game.get(frame)).toEqual({ minPace: 3, maxPace: 5 });
    expect(storedData('how.joi.settings.default')).toEqual({
      'how.joi.classic.image': { highRes: true },
      'how.joi.home': { ageCheckConfirm: true },
    });
    expect(storedData('how.joi.presets.default')).toEqual(
      paceDoc({ minPace: 3 })
    );
    expect(localStorage.getItem('settings')).toBeNull();
    expect(localStorage.getItem('home')).toBeNull();
  });

  it('should start fresh when its file is unusable', () => {
    localStorage.setItem(
      'how.joi.presets.default',
      JSON.stringify({
        version: '99.0.0',
        savedAt: 1,
        data: paceDoc({ minPace: 3 }),
      })
    );
    let frame = boot(8);
    expect(game.get(frame)).toEqual({ minPace: 1, maxPace: 5 });
    expect(frame.how.joi.presets.loaded).toBe(true);

    frame = step(frame, game.set('maxPace', 7));
    frame = settle(frame);
    expect(storedData('how.joi.presets.default')).toEqual(
      paceDoc({ maxPace: 7 })
    );
    expect(
      localStorage.getItem('how.joi.presets.default~99.0.0')
    ).not.toBeNull();
  });

  it('should start a new slot empty on select', () => {
    localStorage.setItem(
      'how.joi.presets.default',
      file(paceDoc({ minPace: 2 }))
    );
    localStorage.setItem('settings', JSON.stringify({ minPace: 9 }));
    let frame = boot();
    frame = step(frame, Presets.select('new'));
    frame = settle(frame);

    expect(game.get(frame)).toEqual({ minPace: 1, maxPace: 5 });
    expect(storedData('how.joi.presets.new')).toEqual({});
    expect(storedData('how.joi.presets.default')).toEqual(
      paceDoc({ minPace: 2 })
    );
  });

  it('should replace the document even before the slot loads', () => {
    localStorage.setItem(
      'how.joi.presets.default',
      file(paceDoc({ minPace: 2, extra: 1 }))
    );
    let frame = step(boot(1), Presets.replace(paceDoc({ minPace: 3 })));
    frame = settle(frame);

    expect(game.get(frame)).toEqual({ minPace: 3, maxPace: 5 });
    expect(storedData('how.joi.presets.default')).toEqual(
      paceDoc({ minPace: 3 })
    );
  });

  it('should replace the whole document and persist it', () => {
    localStorage.setItem(
      'how.joi.presets.default',
      file(paceDoc({ minPace: 2, extra: 1 }))
    );
    let frame = boot();
    frame = step(frame, Presets.replace(paceDoc({ minPace: 3 })));
    frame = settle(frame);

    expect(game.get(frame)).toEqual({ minPace: 3, maxPace: 5 });
    expect(storedData('how.joi.presets.default')).toEqual(
      paceDoc({ minPace: 3 })
    );
  });

  it('should write an empty document when nothing is stored', () => {
    const frame = boot(6);

    expect(game.get(frame)).toEqual({ minPace: 1, maxPace: 5 });
    expect(storedData('how.joi.presets.default')).toEqual({});
  });

  it('should switch documents on select and remember the choice', () => {
    localStorage.setItem(
      'how.joi.presets.default',
      file(paceDoc({ minPace: 2 }))
    );
    localStorage.setItem(
      'how.joi.presets.fast',
      file(paceDoc({ minPace: 4, maxPace: 9 }))
    );
    let frame = boot();
    expect(game.get(frame)).toEqual({ minPace: 2, maxPace: 5 });

    const selecting = step(frame, Presets.select('fast'));
    expect(game.get(selecting)).toEqual({ minPace: 2, maxPace: 5 });
    frame = settle(selecting);
    expect(game.get(frame)).toEqual({ minPace: 4, maxPace: 9 });
    expect(frame.how.joi.presets.current).toBe('fast');
    expect(
      Presets.find(frame, '')
        .map(s => s.slot)
        .sort()
    ).toEqual(['default', 'fast']);

    frame = step(frame, game.set('maxPace', 7));
    frame = settle(frame);
    expect(storedData('how.joi.presets.fast')).toEqual(
      paceDoc({ minPace: 4, maxPace: 7 })
    );
    expect(storedData('how.joi.presets.default')).toEqual(
      paceDoc({ minPace: 2 })
    );

    frame = step(frame, ModuleManager.unload(Presets.id));
    frame = settle(frame);
    frame = step(frame, ModuleManager.load(Presets));
    frame = settle(frame);
    expect(game.get(frame)).toEqual({ minPace: 4, maxPace: 7 });
  });
});
