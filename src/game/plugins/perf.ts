import type { Plugin } from '../../engine/plugins/Plugins';
import type { PerfMetrics } from '../../engine/pipes/Perf';
import { Composer } from '../../engine/Composer';
import { Perf } from '../../engine/pipes/Perf';
import { pluginPaths } from '../../engine/plugins/Plugins';
import Debug from './debug';

const PLUGIN_ID = 'core.perf_overlay';
const ELEMENT_ATTR = 'data-plugin-id';
const STYLE_ID = `${PLUGIN_ID}-styles`;

type PerfOverlayContext = {
  el: HTMLElement;
};

const po = pluginPaths<never, PerfOverlayContext>(PLUGIN_ID);

const COLOR_OK = [0x4a, 0xde, 0x80] as const;
const COLOR_WARN = [0xfa, 0xcc, 0x15] as const;
const COLOR_OVER = [0xf8, 0x71, 0x71] as const;

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

function formatLine(
  id: string,
  phase: string,
  avg: number,
  budget: number
): string {
  const name = id.padEnd(24);
  const ph = phase.padEnd(11);
  const a = `${avg.toFixed(2)}ms`.padStart(8);
  const color = budgetColor(avg, budget);
  return `<span style="color:${color}">${name}${ph}${a}</span>`;
}

export default class PerfOverlay {
  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Performance Overlay',
    },

    activate: Composer.do(({ get, set }) => {
      const style =
        document.getElementById(STYLE_ID) ?? document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        [${ELEMENT_ATTR}="${PLUGIN_ID}"] {
          position: fixed;
          top: 42px;
          right: 8px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 12px;
          font-family: monospace;
          font-size: 11px;
          line-height: 1.4;
          z-index: 9999;
          pointer-events: none;
          white-space: pre;
          border-radius: 4px;
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
      set(po.context, { el });
    }),

    update: Composer.do(({ get }) => {
      const el = get(po.context)?.el;
      if (!el) return;

      const visible = get(Debug.paths.state.visible);
      el.style.display = visible ? '' : 'none';
      if (!visible) return;

      const ctx = get(Perf.paths.context);
      if (!ctx) return;

      const { plugins, config } = ctx;
      const lines: string[] = [];

      let totalAvg = 0;

      for (const [id, phases] of Object.entries(plugins as PerfMetrics)) {
        if (id === PLUGIN_ID) continue;
        for (const [phase, entry] of Object.entries(phases)) {
          if (!entry) continue;
          totalAvg += entry.avg;
          lines.push(formatLine(id, phase, entry.avg, config.pluginBudget));
        }
      }

      if (lines.length > 0) {
        const totalColor = budgetColor(
          totalAvg,
          config.pluginBudget * lines.length
        );
        lines.push('');
        lines.push(
          `<span style="color:${totalColor}">${'frame'.padEnd(35)}${`${totalAvg.toFixed(2)}ms`.padStart(8)}</span>`
        );
      }

      el.innerHTML =
        lines.length > 0
          ? lines.join('\n')
          : '<span style="color:#888">no plugin data</span>';
    }),

    deactivate: Composer.do(({ get, set }) => {
      const el = get(po.context)?.el;
      if (el) el.remove();
      set(po.context, undefined);
    }),
  };
}
