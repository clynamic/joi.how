import { Composer, GameContext, pluginPaths, typedPath } from '../../engine';
import type { Plugin } from '../../engine/plugins/Plugins';
import Debug from './debug';

const PLUGIN_ID = 'core.fps';
const ELEMENT_ATTR = 'data-plugin-id';
const STYLE_ID = `${PLUGIN_ID}-styles`;
const HISTORY_SIZE = 30;

type FpsContext = {
  el: HTMLElement;
  fpsHistory: number[];
  tpsHistory: number[];
  lastWallTime: number;
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
          position: fixed;
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

      document.body.appendChild(el);
      set(fps.context, {
        el,
        fpsHistory: [],
        tpsHistory: [],
        lastWallTime: performance.now(),
      });
    }),

    update: Composer.do(({ get, set }) => {
      const ctx = get(fps.context);
      if (!ctx) return;

      const visible = get(Debug.paths.state.visible);
      if (ctx.el) ctx.el.style.display = visible ? '' : 'none';
      if (!visible) return;

      const now = performance.now();
      const wallDelta = now - ctx.lastWallTime;

      const currentFps = wallDelta > 0 ? 1000 / wallDelta : 0;
      const fpsHistory = [...ctx.fpsHistory, currentFps].slice(-HISTORY_SIZE);
      const avgFps =
        fpsHistory.length > 0
          ? fpsHistory.reduce((sum, v) => sum + v, 0) / fpsHistory.length
          : currentFps;

      const step = get(gameContext.step);
      const currentTps = step > 0 ? 1000 / step : 0;
      const tpsHistory = [...ctx.tpsHistory, currentTps].slice(-HISTORY_SIZE);
      const avgTps =
        tpsHistory.length > 0
          ? tpsHistory.reduce((sum, v) => sum + v, 0) / tpsHistory.length
          : currentTps;

      if (ctx.el)
        ctx.el.textContent = `${Math.round(avgFps)} FPS / ${Math.round(avgTps)} TPS`;

      set(fps.context, { ...ctx, fpsHistory, tpsHistory, lastWallTime: now });
    }),

    deactivate: Composer.do(({ get, set }) => {
      const el = get(fps.context)?.el;
      if (el) el.remove();
      set(fps.context, undefined);
    }),
  };
}
