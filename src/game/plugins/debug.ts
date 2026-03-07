import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine';
import { sdk } from '../../engine/sdk';
import type { Pipe } from '../../engine/State';

const PLUGIN_ID = 'core.debug';

type DebugState = {
  visible: boolean;
};

const debug = pluginPaths<DebugState>(PLUGIN_ID);

let pendingToggle = false;
let handler: ((e: KeyboardEvent) => void) | null = null;

const Debug = definePlugin({
  id: PLUGIN_ID,
  meta: {
    name: 'Debug',
  },

  paths: debug,

  whenDebug(pipe: Pipe): Pipe {
    return frame => (sdk.debug ? pipe(frame) : frame);
  },

  whenVisible(pipe: Pipe): Pipe {
    return Composer.bind(debug, state => Composer.when(!!state?.visible, pipe));
  },

  activate: Composer.do(({ set }) => {
    handler = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        pendingToggle = true;
      }
    };
    window.addEventListener('keydown', handler);
    sdk.debug = false;
    set(debug.visible, false);
  }),

  update: Composer.do(({ get, set }) => {
    if (!pendingToggle) return;
    pendingToggle = false;
    const current = get(debug.visible);
    sdk.debug = !current;
    set(debug.visible, !current);
  }),

  deactivate: Composer.do(({ set }) => {
    if (handler) {
      window.removeEventListener('keydown', handler);
      handler = null;
    }
    pendingToggle = false;
    sdk.debug = false;
    set(debug, undefined);
  }),
});

export default Debug;
