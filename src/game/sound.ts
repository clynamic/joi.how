import { definePlugin } from '../engine/plugins/Plugins';
import { Composer } from '../engine/Composer';
import { Effects } from '../engine/pipes/Effects';
import { Pipe } from '../engine/State';
import Generator from 'wasgen';

let gen: Generator | null = null;

function getGen(): Generator {
  if (!gen) gen = new Generator();
  return gen;
}

export function playTone(frequency: number, delay = 0): number {
  const g = getGen();
  const start = (g.now() as number) + delay;
  return g.play(
    [{ type: 'sine', gain: { a: 0.0237, h: 0, d: 0.0114, s: 1, r: 0.011 } }],
    frequency,
    0.25,
    start,
    start + 0.0237 + 0.0114 + 0.011
  );
}

const PLUGIN_ID = 'how.joi.sound';

export type TonePayload = { frequency: number; delay: number };

const tone = Effects.define<TonePayload>(PLUGIN_ID, 'tone');

const Sound = definePlugin({
  sdk: 'Sound',
  id: PLUGIN_ID,
  meta: {
    name: 'Sound',
  },

  play(frequency: number): Pipe {
    return tone.emit({ frequency, delay: 0 });
  },

  chime(frequencies: number[], gap = 100): Pipe {
    return Composer.pipe(
      ...frequencies.map((frequency, index) =>
        tone.emit({ frequency, delay: (index * gap) / 1000 })
      )
    );
  },

  effects: [tone.perform(({ frequency, delay }) => playTone(frequency, delay))],
});

declare module '../engine/sdk' {
  interface PluginSDK {
    Sound: typeof Sound;
  }
}

export default Sound;
