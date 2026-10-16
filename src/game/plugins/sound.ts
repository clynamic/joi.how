import { definePlugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { Effects } from '../../engine/pipes/Effects';
import { Pipe } from '../../engine/State';
import { playTone } from '../../utils/sound';

const PLUGIN_ID = 'core.sound';

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

declare module '../../engine/sdk' {
  interface PluginSDK {
    Sound: typeof Sound;
  }
}

export default Sound;
