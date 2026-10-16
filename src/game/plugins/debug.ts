import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine';
import { Effects, type Inject } from '../../engine/pipes/Effects';
import { sdk } from '../../engine/sdk';
import type { Pipe } from '../../engine/State';

const PLUGIN_ID = 'core.debug';
const TOGGLE_KEY = 'F3';

type DebugState = {
  visible: boolean;
};

const debug = pluginPaths<DebugState>(PLUGIN_ID);

const listen = Effects.define(PLUGIN_ID, 'listen');
const unlisten = Effects.define(PLUGIN_ID, 'unlisten');

let handler: ((e: KeyboardEvent) => void) | null = null;

function attach(inject: Inject) {
  if (handler) return;
  handler = (e: KeyboardEvent) => {
    if (e.key !== TOGGLE_KEY) return;
    e.preventDefault();
    inject(Debug.toggle());
  };
  window.addEventListener('keydown', handler);
}

function detach() {
  if (!handler) return;
  window.removeEventListener('keydown', handler);
  handler = null;
}

const Debug = definePlugin({
  id: PLUGIN_ID,
  meta: {
    name: 'Debug',
  },

  paths: debug,

  toggle(): Pipe {
    return Composer.do(({ get, set }) => {
      const state = get(debug);
      if (!state) return;
      sdk.debug = !state.visible;
      set(debug.visible, !state.visible);
    });
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
      set(debug, { visible: false });
    }),
    listen.emit()
  ),

  deactivate: Composer.pipe(
    unlisten.emit(),
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
