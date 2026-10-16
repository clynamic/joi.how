import { describe, it, expect, vi, beforeEach } from 'vitest';

const audio = vi.hoisted(() => ({
  played: [] as Array<[number, number]>,
  broken: false,
}));

vi.mock('../../../src/utils/sound', () => ({
  playTone: (frequency: number, delay = 0) => {
    if (audio.broken) throw new Error('no audio device');
    audio.played.push([frequency, delay]);
    return 0;
  },
}));

import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { Events } from '../../../src/engine/pipes/Events';
import {
  ModuleManager,
  moduleManagerPipe,
} from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { lensFromPath } from '../../../src/engine/Lens';
import Sound from '../../../src/game/plugins/sound';
import { makeFrame, tick } from '../../utils';

const basePipe: Pipe = Composer.pipe(
  Effects.pipe,
  Events.pipe,
  moduleManagerPipe
);

const getQueue = (frame: GameFrame): unknown[] =>
  lensFromPath(['core.effects', 'queue']).get(frame) ?? [];

function loaded(): GameFrame {
  const frame0 = basePipe(makeFrame());
  const frame1 = ModuleManager.load(Sound)(frame0);
  return basePipe(tick(frame1));
}

describe('Sound', () => {
  beforeEach(() => {
    audio.played = [];
    audio.broken = false;
  });

  it('should queue a single tone', () => {
    const frame = Sound.play(440)(basePipe(makeFrame()));

    expect(getQueue(frame)).toEqual([
      { type: 'core.sound/tone', payload: { frequency: 440, delay: 0 } },
    ]);
    expect(audio.played).toEqual([]);
  });

  it('should queue a chime spaced by the gap in seconds', () => {
    const frame = Sound.chime([200, 300, 400], 120)(basePipe(makeFrame()));

    expect(getQueue(frame).map(e => (e as any).payload)).toEqual([
      { frequency: 200, delay: 0 },
      { frequency: 300, delay: 0.12 },
      { frequency: 400, delay: 0.24 },
    ]);
  });

  it('should default the chime gap to 100ms', () => {
    const frame = Sound.chime([200, 300])(basePipe(makeFrame()));

    expect(getQueue(frame).map(e => (e as any).payload.delay)).toEqual([
      0, 0.1,
    ]);
  });

  it('should play queued tones on flush', () => {
    const frame = Sound.chime([200, 300], 120)(loaded());

    Effects.flush(frame, () => undefined);

    expect(audio.played).toEqual([
      [200, 0],
      [300, 0.12],
    ]);
  });

  it('should survive a failing audio backend and report each failure', () => {
    audio.broken = true;
    const injected: Pipe[] = [];
    const frame = Sound.chime([200, 300])(loaded());

    expect(() =>
      Effects.flush(frame, pipe => injected.push(pipe))
    ).not.toThrow();
    expect(injected).toHaveLength(2);

    const next = Composer.pipe(...injected)(frame);
    expect(
      next.core.effects.queue.filter(
        (e: { type: string }) => e.type === 'core.log/line'
      )
    ).toHaveLength(2);
  });
});
