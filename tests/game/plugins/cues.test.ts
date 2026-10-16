import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { Events } from '../../../src/engine/pipes/Events';
import { Scheduler } from '../../../src/engine/pipes/Scheduler';
import {
  ModuleManager,
  moduleManagerPipe,
} from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Cues from '../../../src/game/plugins/cues';
import Messages from '../../../src/game/plugins/messages';
import Phase, { GamePhase } from '../../../src/game/plugins/phase';
import Sound from '../../../src/game/plugins/sound';
import { makeFrame, tick } from '../../utils';

const gamePipe: Pipe = Composer.pipe(
  Effects.pipe,
  Events.pipe,
  Scheduler.pipe,
  moduleManagerPipe
);

type Tone = { frequency: number; delay: number };

const tones = (frame: GameFrame): Tone[] =>
  (frame?.core?.effects?.queue ?? [])
    .filter((e: { type: string }) => e.type === 'core.sound/tone')
    .map((e: { payload: Tone }) => e.payload);

const frequencies = (frame: GameFrame): number[] =>
  tones(frame).map(t => t.frequency);

const setStroke = (stroke: string): Pipe =>
  Composer.set(['core.stroke'], { stroke, timer: 0 });

function bootstrap(): GameFrame {
  let frame = gamePipe(makeFrame());
  frame = Composer.pipe(
    ModuleManager.load(Sound),
    ModuleManager.load(Phase),
    ModuleManager.load(Messages),
    ModuleManager.load(Cues)
  )(frame);
  frame = gamePipe(tick(frame));
  return gamePipe(tick(frame));
}

function step(frame: GameFrame, impulse: Pipe = f => f): GameFrame {
  return Composer.pipe(impulse, gamePipe)(tick(frame));
}

describe('Cues', () => {
  it('should play one tone per stroke direction', () => {
    let frame = step(bootstrap(), setStroke('up'));
    const up = frequencies(frame);
    frame = step(frame, setStroke('down'));
    const down = frequencies(frame);

    expect(up).toEqual([425]);
    expect(down).toEqual([625]);
  });

  it('should stay quiet while the stroke holds', () => {
    let frame = step(bootstrap(), setStroke('up'));
    frame = step(frame);
    frame = step(frame);

    expect(frequencies(frame)).toEqual([]);
  });

  it('should chime down on entering a break', () => {
    const frame = step(bootstrap(), Phase.setPhase(GamePhase.break));

    expect(frequencies(frame)).toEqual([400, 300, 250, 200, 200]);
    expect(tones(frame).map(t => t.delay)).toEqual([0, 0.1, 0.2, 0.3, 0.4]);
  });

  it('should chime up when a break returns to active', () => {
    let frame = step(bootstrap(), Phase.setPhase(GamePhase.break));
    frame = step(frame, Phase.setPhase(GamePhase.active));

    expect(frequencies(frame)).toEqual([200, 300, 350, 400, 400]);
  });

  it('should not chime up when active follows warmup', () => {
    const frame = step(bootstrap(), Phase.setPhase(GamePhase.active));

    expect(frequencies(frame)).toEqual([]);
  });

  it('should sweep down on climax spaced by the climax gap', () => {
    const frame = step(bootstrap(), Phase.setPhase(GamePhase.climax));

    expect(frequencies(frame)).toEqual([
      255, 249, 243, 237, 231, 225, 219, 213, 207, 201, 195, 189, 183, 177, 171,
    ]);
    expect(tones(frame).map(t => Math.round(t.delay * 1000))).toEqual(
      Array.from({ length: 15 }, (_, i) => i * 400)
    );
  });

  it('should beep when a message appears or changes', () => {
    let frame = step(bootstrap(), Messages.send({ id: 'a', title: 'Hi' }));
    const appeared = frequencies(frame);
    frame = step(frame, Messages.send({ id: 'a', description: 'more' }));
    const changed = frequencies(frame);

    expect(appeared).toEqual([200]);
    expect(changed).toEqual([200]);
  });

  it('should not beep when a message is resent unchanged', () => {
    let frame = step(bootstrap(), Messages.send({ id: 'a', title: 'Hi' }));
    expect(frequencies(frame)).toEqual([200]);
    frame = step(frame, Messages.send({ id: 'a', title: 'Hi' }));

    expect(frequencies(frame)).toEqual([]);
  });
});
