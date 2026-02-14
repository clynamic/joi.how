import { Composer } from '../Composer';
import { GameContext, Pipe } from '../State';
import { Events, type GameEvent } from './Events';
import { pluginPaths, PluginId } from '../plugins/Plugins';
import { typedPath } from '../Lens';
import { sdk } from '../sdk';

export type PluginPerfEntry = {
  last: number;
  avg: number;
  max: number;
  samples: number[];
  lastTick: number;
};

export type PerfMetrics = Record<
  PluginId,
  Record<string, PluginPerfEntry>
>;

export type PerfConfig = {
  pluginBudget: number;
};

export type PerfContext = {
  plugins: PerfMetrics;
  config: PerfConfig;
};

const PLUGIN_NAMESPACE = 'core.perf';
const SAMPLE_SIZE = 60;
const EXPIRY_TICKS = 900;

const DEFAULT_CONFIG: PerfConfig = {
  pluginBudget: 1,
};

type OverBudgetPayload = { id: string; phase: string; duration: number; budget: number };

const eventType = Events.getKeys(PLUGIN_NAMESPACE, 'over_budget', 'configure');

const perf = pluginPaths<never, PerfContext>(PLUGIN_NAMESPACE);
const gameContext = typedPath<GameContext>(['context']);

export class Perf {
  static withTiming(
    id: PluginId,
    phase: string,
    pluginPipe: Pipe
  ): Pipe {
    return Composer.do(({ get, set, pipe }) => {
      if (!sdk.debug) {
        pipe(pluginPipe);
        return;
      }

      const before = performance.now();
      pipe(pluginPipe);
      const after = performance.now();
      const duration = after - before;

      const tick = get(gameContext.tick) ?? 0;
      const ctx = get(perf.context) ?? { plugins: {}, config: DEFAULT_CONFIG };
      const pluginMetrics = ctx.plugins[id] ?? {};
      const entry = pluginMetrics[phase];

      const samples = entry
        ? [...entry.samples, duration].slice(-SAMPLE_SIZE)
        : [duration];

      const avg =
        samples.length > 0
          ? samples.reduce((sum, v) => sum + v, 0) / samples.length
          : duration;

      const max = entry ? Math.max(entry.max, duration) : duration;

      const newEntry: PluginPerfEntry = {
        last: duration,
        avg,
        max,
        samples,
        lastTick: tick,
      };

      set(perf.context, {
        ...ctx,
        plugins: {
          ...ctx.plugins,
          [id]: {
            ...pluginMetrics,
            [phase]: newEntry,
          },
        },
      });

      const budget = ctx.config.pluginBudget;
      if (duration > budget) {
        if (sdk.debug) {
          console.warn(
            `[perf] ${id} ${phase} took ${duration.toFixed(2)}ms (budget: ${budget}ms)`
          );
        }
        pipe(
          Events.dispatch({
            type: eventType.overBudget,
            payload: { id, phase, duration, budget },
          })
        );
      }
    });
  }

  static configure(config: Partial<PerfConfig>): Pipe {
    return Events.dispatch({
      type: eventType.configure,
      payload: config,
    });
  }

  static onOverBudget(fn: (event: GameEvent<OverBudgetPayload>) => Pipe): Pipe {
    return Events.handle<OverBudgetPayload>(eventType.overBudget, fn);
  }

  static pipe: Pipe = Composer.pipe(
    Composer.over(
      perf.context,
      (ctx = { plugins: {}, config: DEFAULT_CONFIG }) => ({
        ...ctx,
        plugins: ctx.plugins ?? {},
        config: ctx.config ?? DEFAULT_CONFIG,
      })
    ),

    Composer.do(({ get, set }) => {
      const tick = get(gameContext.tick) ?? 0;
      const ctx = get(perf.context);
      if (!ctx) return;

      let dirty = false;
      const pruned: PerfMetrics = {};

      for (const [id, phases] of Object.entries(ctx.plugins)) {
        const kept: Record<string, PluginPerfEntry> = {};
        for (const [phase, entry] of Object.entries(phases)) {
          if (entry && tick - entry.lastTick <= EXPIRY_TICKS) {
            kept[phase] = entry;
          } else {
            dirty = true;
          }
        }
        if (Object.keys(kept).length > 0) {
          pruned[id] = kept;
        } else {
          dirty = true;
        }
      }

      if (dirty) {
        set(perf.context, { ...ctx, plugins: pruned });
      }
    }),

    Events.handle<Partial<PerfConfig>>(eventType.configure, event =>
      Composer.over(perf.context, ctx => ({
        ...ctx,
        config: {
          ...ctx.config,
          ...event.payload,
        },
      }))
    )
  );

  static get paths() {
    return perf;
  }
}
