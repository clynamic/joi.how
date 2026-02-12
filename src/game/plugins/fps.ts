import { Plugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';

const PLUGIN_ID = 'core.fps';
const PLUGIN_VERSION = '0.1.0';
const ELEMENT_ATTR = 'data-plugin-id';
const HISTORY_SIZE = 30;

export type FpsState = {
  value: number;
  history: number[];
};

type FpsContext = {
  el: HTMLElement;
};

const fps = pluginPaths<FpsState, FpsContext>(PLUGIN_ID);

export function createFpsPlugin(): Plugin {
  return {
    id: PLUGIN_ID,
    meta: {
      name: 'FPS Counter',
      version: PLUGIN_VERSION,
    },

    activate: frame => {
      const existing = document.querySelector(
        `[${ELEMENT_ATTR}="${PLUGIN_ID}"]`
      );
      if (existing) existing.remove();

      const el = document.createElement('div');
      el.setAttribute(ELEMENT_ATTR, PLUGIN_ID);
      Object.assign(el.style, {
        position: 'absolute',
        top: '8px',
        right: '8px',
        background: 'black',
        color: 'white',
        padding: '4px 8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: '9999',
        pointerEvents: 'none',
      });
      document.querySelector('.game-page')?.appendChild(el);

      return Composer.pipe(
        Composer.set(fps.state, { value: 0, history: [] }),
        Composer.set(fps.context, { el })
      )(frame);
    },

    update: Composer.do(({ get, set }) => {
      const delta = get<number>(['context', 'deltaTime']);
      const s = get(fps.state);
      const el = get(fps.context)?.el;

      const current = delta > 0 ? 1000 / delta : 0;
      const history = [...s.history, current].slice(-HISTORY_SIZE);
      const avg =
        history.length > 0
          ? history.reduce((sum, v) => sum + v, 0) / history.length
          : current;

      if (el) el.textContent = `${Math.round(avg)} FPS`;

      set(fps.state, { value: current, history });
    }),

    deactivate: Composer.do(({ get, set }) => {
      const el = get(fps.context)?.el;
      if (el) el.remove();
      set(fps.state, undefined);
      set(fps.context, undefined);
    }),
  };
}
