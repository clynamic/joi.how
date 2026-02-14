import { Composer, GameContext, pluginPaths, typedPath } from '../../engine';
import type { Plugin } from '../../engine/plugins/Plugins';
import Debug from './debug';

const PLUGIN_ID = 'core.fps';
const ELEMENT_ATTR = 'data-plugin-id';
const STYLE_ID = `${PLUGIN_ID}-styles`;
const HISTORY_SIZE = 30;

type FpsContext = {
  el: HTMLElement;
  history: number[];
};

const fps = pluginPaths<never, FpsContext>(PLUGIN_ID);
const gameContext = typedPath<GameContext>(['context']);

export default class Fps {
  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'FPS Counter',
    },

    activate: Composer.do(({ get, set }) => {
      const style =
        document.getElementById(STYLE_ID) ?? document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        [${ELEMENT_ATTR}="${PLUGIN_ID}"] {
          position: absolute;
          top: 8px;
          right: 8px;
          background: black;
          color: white;
          padding: 4px 8px;
          font-family: monospace;
          font-size: 12px;
          z-index: 9999;
          pointer-events: none;
        }
      `;
      if (!style.parentNode) document.head.appendChild(style);

      const existing = document.querySelector(
        `[${ELEMENT_ATTR}="${PLUGIN_ID}"]`
      );
      if (existing) existing.remove();

      const el = document.createElement('div');
      el.setAttribute(ELEMENT_ATTR, PLUGIN_ID);

      const visible = get(Debug.paths.state.visible);
      el.style.display = visible ? '' : 'none';

      document.querySelector('.game-page')?.appendChild(el);
      set(fps.context, { el, history: [] });
    }),

    update: Composer.do(({ get, set }) => {
      const ctx = get(fps.context);
      if (!ctx) return;

      const visible = get(Debug.paths.state.visible);
      if (ctx.el) ctx.el.style.display = visible ? '' : 'none';
      if (!visible) return;

      const delta = get(gameContext.deltaTime);
      const current = delta > 0 ? 1000 / delta : 0;
      const history = [...ctx.history, current].slice(-HISTORY_SIZE);
      const avg =
        history.length > 0
          ? history.reduce((sum, v) => sum + v, 0) / history.length
          : current;

      if (ctx.el) ctx.el.textContent = `${Math.round(avg)} FPS`;

      set(fps.context, { ...ctx, history });
    }),

    deactivate: Composer.do(({ get, set }) => {
      const el = get(fps.context)?.el;
      if (el) el.remove();
      set(fps.context, undefined);
    }),
  };
}
