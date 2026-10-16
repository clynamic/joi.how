import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine';
import { Effects } from '../../engine/pipes/Effects';
import Debug from './debug';

const PLUGIN_ID = 'core.fps';
const ELEMENT_ATTR = 'data-plugin-id';
const STYLE_ID = `${PLUGIN_ID}-styles`;
const HISTORY_SIZE = 30;

type FpsState = {
  visible: boolean;
};

const fps = pluginPaths<FpsState>(PLUGIN_ID);

const show = Effects.define(PLUGIN_ID, 'show');
const hide = Effects.define(PLUGIN_ID, 'hide');
const unmount = Effects.define(PLUGIN_ID, 'unmount');

let el: HTMLElement | null = null;
let rafId = 0;
let lastFrameTime: number | null = null;
let fpsHistory: number[] = [];
let tickTimestamps: number[] = [];

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

function mount(): HTMLElement {
  if (el) return el;

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

  document.querySelector(`[${ELEMENT_ATTR}="${PLUGIN_ID}"]`)?.remove();

  el = document.createElement('div');
  el.setAttribute(ELEMENT_ATTR, PLUGIN_ID);
  document.body.appendChild(el);

  lastFrameTime = null;
  fpsHistory = [];
  tickTimestamps = [];
  rafId = requestAnimationFrame(rafLoop);

  return el;
}

function paint() {
  const target = mount();
  target.style.display = '';

  const now = performance.now();
  tickTimestamps = [...tickTimestamps, now].filter(t => t >= now - 1000);

  const avgFps =
    fpsHistory.length > 0
      ? fpsHistory.reduce((sum, v) => sum + v, 0) / fpsHistory.length
      : 0;

  target.textContent = `${Math.round(avgFps)} FPS / ${tickTimestamps.length} TPS`;
}

function conceal() {
  if (el) el.style.display = 'none';
}

function teardown() {
  cancelAnimationFrame(rafId);
  rafId = 0;
  lastFrameTime = null;
  fpsHistory = [];
  tickTimestamps = [];
  el?.remove();
  el = null;
}

const Fps = definePlugin({
  id: PLUGIN_ID,
  meta: {
    name: 'FPS Counter',
  },

  activate: Composer.set(fps, { visible: false }),

  update: Composer.do(({ get, set, pipe }) => {
    const state = get(fps);
    if (!state) return;

    const visible = !!get(Debug.paths.visible);
    if (visible) {
      pipe(show.emit());
    } else if (state.visible) {
      pipe(hide.emit());
    }
    if (visible !== state.visible) set(fps.visible, visible);
  }),

  deactivate: Composer.pipe(unmount.emit(), Composer.set(fps, undefined)),

  effects: [
    show.perform(() => paint()),
    hide.perform(() => conceal()),
    unmount.perform(() => teardown()),
  ],
});

export default Fps;
