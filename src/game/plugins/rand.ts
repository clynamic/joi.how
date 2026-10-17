import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { Pipe } from '../../engine/State';
import Saves from './saves';

const PLUGIN_ID = 'core.rand';

type RandState = {
  seed: string;
  cursor: number;
};

const paths = pluginPaths<RandState>(PLUGIN_ID);

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

const MODULUS = 0x7fffffff;

const live = (cursor: number | undefined): number =>
  Number.isInteger(cursor) && cursor !== 0 ? cursor! : 1;

function advance(cursor: number | undefined): [number, number] {
  const next = live(Math.imul(48271, live(cursor)) % MODULUS);
  return [next, (next & MODULUS) / MODULUS];
}

const fresh: Pipe = Composer.do(({ set }) => {
  const seed = Date.now().toString();
  set(paths, { seed, cursor: live(stringToSeed(seed)) });
});

const Rand = definePlugin({
  sdk: 'Rand',
  id: PLUGIN_ID,
  meta: {
    name: 'Rand',
  },

  activate: fresh,

  update: Composer.pipe(
    Saves.onSave(PLUGIN_ID, get => get(paths)),
    Saves.onLoad<RandState>(PLUGIN_ID, data =>
      data ? Composer.set(paths, data) : fresh
    )
  ),

  deactivate: Composer.set(paths, undefined),

  seed(value: string): Pipe {
    return Composer.set(paths, {
      seed: value,
      cursor: live(stringToSeed(value)),
    });
  },

  next(fn: (value: number) => Pipe): Pipe {
    return Composer.do(({ get, set, pipe }) => {
      const [cursor, value] = advance(get(paths.cursor));
      set(paths.cursor, cursor);
      pipe(fn(value));
    });
  },

  nextInt(max: number, fn: (value: number) => Pipe): Pipe {
    return Rand.next(v => fn(Math.floor(v * max)));
  },

  nextFloatRange(min: number, max: number, fn: (value: number) => Pipe): Pipe {
    return Rand.next(v => fn(v * (max - min) + min));
  },

  pick<T>(arr: T[], fn: (value: T) => Pipe): Pipe {
    return Rand.nextInt(arr.length, i => fn(arr[i]));
  },

  shuffle<T>(arr: T[], fn: (shuffled: T[]) => Pipe): Pipe {
    return Composer.do(({ get, set, pipe }) => {
      let cursor = get(paths.cursor);
      const shuffled = [...arr];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const [c, v] = advance(cursor);
        cursor = c;
        const j = Math.floor(v * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      set(paths.cursor, cursor);
      pipe(fn(shuffled));
    });
  },

  get paths() {
    return paths;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Rand: typeof Rand;
  }
}

export default Rand;
