import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine';
import { Effects, type Inject } from '../../engine/pipes/Effects';
import { sdk } from '../../engine/sdk';
import type { Pipe } from '../../engine/State';

const PLUGIN_ID = 'core.debug';
const TOGGLE_KEY = 'F3';
const FASTER_KEYS = ['+', '='];
const SLOWER_KEYS = ['-', '_'];
const MAX_SPEED = 16;

type DebugState = {
  visible: boolean;
  speed: number;
};

const debug = pluginPaths<DebugState>(PLUGIN_ID);

const listen = Effects.define(PLUGIN_ID, 'listen');
const unlisten = Effects.define(PLUGIN_ID, 'unlisten');
const speed = Effects.define<{ factor: number }>(PLUGIN_ID, 'speed');

let handler: ((e: KeyboardEvent) => void) | null = null;

function attach(inject: Inject) {
  if (handler) return;
  handler = (e: KeyboardEvent) => {
    if (e.key === TOGGLE_KEY) {
      e.preventDefault();
      inject(Debug.toggle());
    } else if (FASTER_KEYS.includes(e.key)) {
      inject(Debug.whenVisible(Debug.faster()));
    } else if (SLOWER_KEYS.includes(e.key)) {
      inject(Debug.whenVisible(Debug.slower()));
    }
  };
  window.addEventListener('keydown', handler);
}

function detach() {
  if (!handler) return;
  window.removeEventListener('keydown', handler);
  handler = null;
}

const clampSpeed = (factor: number) =>
  Math.min(MAX_SPEED, Math.max(1, Math.round(factor)));

const Debug = definePlugin({
  id: PLUGIN_ID,
  meta: {
    name: 'Debug',
  },

  paths: debug,

  speed,

  toggle(): Pipe {
    return Composer.do(({ get, set }) => {
      const state = get(debug);
      if (!state) return;
      sdk.debug = !state.visible;
      set(debug.visible, !state.visible);
    });
  },

  setSpeed(factor: number): Pipe {
    return Composer.do(({ get, set, pipe }) => {
      const state = get(debug);
      if (!state) return;
      const next = clampSpeed(factor);
      if (next === state.speed) return;
      set(debug.speed, next);
      pipe(speed.emit({ factor: next }));
    });
  },

  faster(): Pipe {
    return Composer.bind(debug, state =>
      Debug.setSpeed((state?.speed ?? 1) * 2)
    );
  },

  slower(): Pipe {
    return Composer.bind(debug, state =>
      Debug.setSpeed((state?.speed ?? 1) / 2)
    );
  },

  whenDebug(pipe: Pipe): Pipe {
    return frame => (sdk.debug ? pipe(frame) : frame);
  },

  whenVisible(pipe: Pipe): Pipe {
    return Composer.bind(debug, state => Composer.when(!!state?.visible, pipe));
  },

  activate: Composer.pipe(
    Composer.do(({ set }) => {
      sdk.debug = false;
      set(debug, { visible: false, speed: 1 });
    }),
    listen.emit()
  ),

  deactivate: Composer.pipe(
    unlisten.emit(),
    speed.emit({ factor: 1 }),
    Composer.do(({ set }) => {
      sdk.debug = false;
      set(debug, undefined);
    })
  ),

  effects: [
    listen.perform((_, inject) => attach(inject)),
    unlisten.perform(() => detach()),
  ],
});

export default Debug;
