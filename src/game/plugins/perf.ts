import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import type { PluginPerfEntry } from '../../engine/pipes/Perf';
import { Composer } from '../../engine/Composer';
import { Effects } from '../../engine/pipes/Effects';
import { Perf } from '../../engine/pipes/Perf';
import { typedPath } from '../../engine/Lens';
import { GameTiming } from '../../engine/State';
import Debug from './debug';

const PLUGIN_ID = 'core.perf_overlay';
const ELEMENT_ATTR = 'data-plugin-id';
const STYLE_ID = `${PLUGIN_ID}-styles`;
const REPAINT_TICKS = 15;

type PerfOverlayState = {
  visible: boolean;
};

export type PerfRow = {
  id: string;
  phase: string;
  perFrame: number;
  max: number;
};

export type PerfView = {
  rows: PerfRow[];
  budget: number;
};

const po = pluginPaths<PerfOverlayState>(PLUGIN_ID);
const timing = typedPath<GameTiming>([]);

const view = Effects.define<PerfView>(PLUGIN_ID, 'view');
const hide = Effects.define(PLUGIN_ID, 'hide');
const unmount = Effects.define(PLUGIN_ID, 'unmount');

const COLOR_OK = [0x4a, 0xde, 0x80] as const;
const COLOR_WARN = [0xfa, 0xcc, 0x15] as const;
const COLOR_OVER = [0xf8, 0x71, 0x71] as const;

let el: HTMLElement | null = null;

function lerpRgb(
  a: readonly number[],
  b: readonly number[],
  t: number
): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

function budgetColor(duration: number, budget: number): string {
  const ratio = duration / budget;
  if (ratio <= 0) return lerpRgb(COLOR_OK, COLOR_OK, 0);
  if (ratio < 1) return lerpRgb(COLOR_OK, COLOR_WARN, ratio);
  return lerpRgb(COLOR_WARN, COLOR_OVER, Math.min(ratio - 1, 1));
}

function cells(values: string[], color?: string): string {
  const style = color ? ` style="color:${color}"` : '';
  return values.map(v => `<span${style}>${v}</span>`).join('');
}

function formatRow(row: PerfRow, budget: number): string {
  const name = row.id.length > 28 ? row.id.slice(0, 27) + '…' : row.id;
  return cells(
    [name, row.phase, row.perFrame.toFixed(2), row.max.toFixed(2)],
    budgetColor(row.perFrame, budget)
  );
}

export function collectRows(
  plugins: Record<string, any>,
  skip: string
): PerfRow[] {
  const rows: PerfRow[] = [];
  const walk = (node: Record<string, any>, prefix: string[]) => {
    for (const [key, value] of Object.entries(node)) {
      if (!value || typeof value !== 'object') continue;
      if ('lastTick' in value) {
        const id = prefix.join('.');
        if (id === skip) continue;
        const entry = value as PluginPerfEntry;
        rows.push({ id, phase: key, perFrame: entry.perFrame, max: entry.max });
      } else {
        walk(value, [...prefix, key]);
      }
    }
  };
  walk(plugins, []);
  rows.sort((a, b) => b.perFrame - a.perFrame);
  return rows;
}

function mount(): HTMLElement {
  if (el) return el;

  const style =
    document.getElementById(STYLE_ID) ?? document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    [${ELEMENT_ATTR}="${PLUGIN_ID}"] {
      position: fixed;
      top: 42px;
      right: 8px;
      display: grid;
      grid-template-columns: auto auto auto auto;
      column-gap: 12px;
      row-gap: 1px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      font-family: monospace;
      font-size: 11px;
      line-height: 1.4;
      z-index: 9999;
      pointer-events: none;
      border-radius: 4px;
    }
    [${ELEMENT_ATTR}="${PLUGIN_ID}"] > span:nth-child(4n + 3),
    [${ELEMENT_ATTR}="${PLUGIN_ID}"] > span:nth-child(4n + 4) {
      text-align: right;
    }
    [${ELEMENT_ATTR}="${PLUGIN_ID}"] > .head {
      color: #888;
      padding-bottom: 4px;
    }
    [${ELEMENT_ATTR}="${PLUGIN_ID}"] > .total {
      padding-top: 4px;
    }
  `;
  if (!style.parentNode) document.head.appendChild(style);

  document.querySelector(`[${ELEMENT_ATTR}="${PLUGIN_ID}"]`)?.remove();

  el = document.createElement('div');
  el.setAttribute(ELEMENT_ATTR, PLUGIN_ID);
  document.body.appendChild(el);
  return el;
}

function paint({ rows, budget }: PerfView) {
  const target = mount();
  target.style.display = '';

  if (rows.length === 0) {
    target.innerHTML = '<span style="color:#888">no plugin data</span>';
    return;
  }

  const head = ['plugin', 'phase', 'ms/frame', 'max']
    .map(v => `<span class="head">${v}</span>`)
    .join('');
  const body = rows.map(r => formatRow(r, budget)).join('');
  const total = rows.reduce((sum, r) => sum + r.perFrame, 0);
  const totalColor = budgetColor(total, budget * rows.length);
  const foot = ['frame', '', total.toFixed(2), '']
    .map(v => `<span class="total" style="color:${totalColor}">${v}</span>`)
    .join('');

  target.innerHTML = head + body + foot;
}

function conceal() {
  if (el) el.style.display = 'none';
}

function teardown() {
  el?.remove();
  el = null;
}

const PerfOverlay = definePlugin({
  id: PLUGIN_ID,
  meta: {
    name: 'Performance Overlay',
  },

  activate: Composer.set(po, { visible: false }),

  update: Composer.do(({ get, set, pipe }) => {
    const state = get(po);
    if (!state) return;

    const visible = !!get(Debug.paths.visible);
    const tick = get(timing.tick) ?? 0;
    if (visible && (!state.visible || tick % REPAINT_TICKS === 0)) {
      const perf = get(Perf.paths);
      pipe(
        view.emit({
          rows: collectRows(perf?.plugins ?? {}, PLUGIN_ID),
          budget: perf?.config.pluginBudget ?? 0,
        })
      );
    } else if (!visible && state.visible) {
      pipe(hide.emit());
    }
    if (visible !== state.visible) set(po.visible, visible);
  }),

  deactivate: Composer.pipe(unmount.emit(), Composer.set(po, undefined)),

  effects: [
    view.perform(payload => paint(payload)),
    hide.perform(() => conceal()),
    unmount.perform(() => teardown()),
  ],
});

export default PerfOverlay;
