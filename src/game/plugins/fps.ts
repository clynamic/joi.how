import { Composer, pluginPaths } from '../../engine';
import type { Plugin } from '../../engine/plugins/Plugins';
import Debug from './debug';

const PLUGIN_ID = 'core.fps';
const ELEMENT_ATTR = 'data-plugin-id';
const STYLE_ID = `${PLUGIN_ID}-styles`;
const HISTORY_SIZE = 30;

type FpsContext = {
  el: HTMLElement;
  tickTimestamps: number[];
};

const fps = pluginPaths<FpsContext>(PLUGIN_ID);

let rafId = 0;
let lastFrameTime: number | null = null;
let fpsHistory: number[] = [];

function rafLoop() {
  const now = performance.now();
  if (lastFrameTime !== null) {
    const delta = now - lastFrameTime;
    if (delta > 0) {
      fpsHistory = [...fpsHistory, 1000 / delta].slice(-HISTORY_SIZE);
    }
  }
  lastFrameTime = now;
  rafId = requestAnimationFrame(rafLoop);
}

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

      const visible = get(Debug.paths.visible);
      el.style.display = visible ? '' : 'none';

      document.body.appendChild(el);

      lastFrameTime = null;
      fpsHistory = [];
      rafId = requestAnimationFrame(rafLoop);

      set(fps, { el, tickTimestamps: [] });
    }),

    update: Composer.do(({ get, set }) => {
      const ctx = get(fps);
      if (!ctx) return;

      const visible = get(Debug.paths.visible);
      if (ctx.el) ctx.el.style.display = visible ? '' : 'none';
      if (!visible) return;

      const avgFps =
        fpsHistory.length > 0
          ? fpsHistory.reduce((sum, v) => sum + v, 0) / fpsHistory.length
          : 0;

      const now = performance.now();
      const cutoff = now - 1000;
      const tickTimestamps = [...ctx.tickTimestamps, now].filter(
        t => t >= cutoff
      );

      if (ctx.el)
        ctx.el.textContent = `${Math.round(avgFps)} FPS / ${tickTimestamps.length} TPS`;

      set(fps, { ...ctx, tickTimestamps });
    }),

    deactivate: Composer.do(({ get, set }) => {
      cancelAnimationFrame(rafId);
      rafId = 0;
      lastFrameTime = null;
      fpsHistory = [];

      const el = get(fps)?.el;
      if (el) el.remove();
      set(fps, undefined);
    }),
  };
}
