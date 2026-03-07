import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { Pipe } from '../../engine/State';

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

function advance(cursor: number): [number, number] {
  const next = Math.imul(48271, cursor) % 0x7fffffff;
  return [next, (next & 0x7fffffff) / 0x7fffffff];
}

const Rand = definePlugin({
  name: 'Rand',
  id: PLUGIN_ID,
  meta: {
    name: 'Rand',
  },

  activate: Composer.do(({ set }) => {
    const seed = Date.now().toString();
    set(paths, { seed, cursor: stringToSeed(seed) });
  }),

  deactivate: Composer.set(paths, undefined),

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
