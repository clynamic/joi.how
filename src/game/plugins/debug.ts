import { Composer, pluginPaths } from '../../engine';
import { sdk } from '../../engine/sdk';
import type { Pipe } from '../../engine/State';
import type { Plugin } from '../../engine/plugins/Plugins';

const PLUGIN_ID = 'core.debug';

type DebugState = {
  visible: boolean;
};

const debug = pluginPaths<DebugState>(PLUGIN_ID);

let pendingToggle = false;
let handler: ((e: KeyboardEvent) => void) | null = null;

export default class Debug {
  static paths = debug;

  static whenDebug(pipe: Pipe): Pipe {
    return frame => (sdk.debug ? pipe(frame) : frame);
  }

  static whenVisible(pipe: Pipe): Pipe {
    return Composer.bind(debug.state, state =>
      Composer.when(!!state?.visible, pipe)
    );
  }

  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Debug',
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
      set(debug.state.visible, false);
    }),

    update: Composer.do(({ get, set }) => {
      if (!pendingToggle) return;
      pendingToggle = false;
      const current = get(debug.state.visible);
      sdk.debug = !current;
      set(debug.state.visible, !current);
    }),

    deactivate: Composer.do(({ set }) => {
      if (handler) {
        window.removeEventListener('keydown', handler);
        handler = null;
      }
      pendingToggle = false;
      sdk.debug = false;
      set(debug.state, undefined);
    }),
  };
}
