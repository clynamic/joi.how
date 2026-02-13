import type { Plugin } from '../../engine/plugins/Plugins';
import type { PerfMetrics, PluginHookPhase } from '../../engine/pipes/Perf';
import { sdk } from '../../engine/sdk';

const { Composer, Perf, pluginPaths } = sdk;

const PLUGIN_ID = 'core.perf_overlay';
const ELEMENT_ATTR = 'data-plugin-id';
const STYLE_ID = `${PLUGIN_ID}-styles`;

type PerfOverlayContext = {
  el: HTMLElement;
};

const po = pluginPaths<never, PerfOverlayContext>(PLUGIN_ID);

function budgetColor(duration: number, budget: number): string {
  const ratio = duration / budget;
  if (ratio < 0.5) return '#4ade80';
  if (ratio < 1.0) return '#facc15';
  return '#f87171';
}

function formatLine(
  id: string,
  phase: PluginHookPhase,
  last: number,
  avg: number,
  budget: number
): string {
  const name = id.padEnd(24);
  const ph = phase.padEnd(11);
  const l = `${last.toFixed(2)}ms`.padStart(8);
  const a = `avg ${avg.toFixed(2)}ms`.padStart(12);
  const color = budgetColor(avg, budget);
  return `<span style="color:${color}">${name}${ph}${l}${a}</span>`;
}

export default class PerfOverlay {
  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Performance Overlay',
    },

    activate: frame => {
      const style =
        document.getElementById(STYLE_ID) ?? document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        [${ELEMENT_ATTR}="${PLUGIN_ID}"] {
          position: absolute;
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
      document.querySelector('.game-page')?.appendChild(el);

      return Composer.set(po.context, { el })(frame);
    },

    update: Composer.do(({ get }) => {
      const el = get(po.context)?.el;
      if (!el) return;

      const ctx = get(Perf.paths.context);
      if (!ctx) return;

      const { plugins, config } = ctx;
      const lines: string[] = [];
      const phaseOrder: PluginHookPhase[] = [
        'activate',
        'update',
        'deactivate',
      ];

      for (const phase of phaseOrder) {
        for (const [id, phases] of Object.entries(plugins as PerfMetrics)) {
          if (id === PLUGIN_ID) continue;
          const entry = phases[phase];
          if (!entry) continue;
          lines.push(
            formatLine(id, phase, entry.last, entry.avg, config.pluginBudget)
          );
        }
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
