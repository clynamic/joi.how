import { Composer } from '../Composer';
import { GameFrame, Pipe } from '../State';
import { Events, getEventKey, GameEvent } from './Events';
import { pluginPaths, PluginId } from '../plugins/Plugins';

export type PluginHookPhase = 'activate' | 'update' | 'deactivate';

export type PluginPerfEntry = {
  last: number;
  avg: number;
  max: number;
  samples: number[];
};

export type PerfMetrics = Record<
  PluginId,
  Partial<Record<PluginHookPhase, PluginPerfEntry>>
>;

export type PerfConfig = {
  pluginBudget: number;
};

export type PerfContext = {
  plugins: PerfMetrics;
  config: PerfConfig;
};

const PLUGIN_NAMESPACE = 'core.perf';
const WINDOW_SIZE = 60;

const DEFAULT_CONFIG: PerfConfig = {
  pluginBudget: 4,
};

const eventType = {
  overBudget: getEventKey(PLUGIN_NAMESPACE, 'over_budget'),
  configure: getEventKey(PLUGIN_NAMESPACE, 'configure'),
};

const perf = pluginPaths<never, PerfContext>(PLUGIN_NAMESPACE);

export function withTiming(
  id: PluginId,
  phase: PluginHookPhase,
  pluginPipe: Pipe
): Pipe {
  return Composer.do<GameFrame>(({ get, set, pipe }) => {
    const before = performance.now();
    pipe(pluginPipe);
    const after = performance.now();
    const duration = after - before;

    const ctx = get(perf.context) ?? { plugins: {}, config: DEFAULT_CONFIG };
    const pluginMetrics = ctx.plugins[id] ?? {};
    const entry = pluginMetrics[phase];

    const samples = entry
      ? [...entry.samples, duration].slice(-WINDOW_SIZE)
      : [duration];

    const avg =
      samples.length > 0
        ? samples.reduce((sum, v) => sum + v, 0) / samples.length
        : duration;

    const max = entry ? Math.max(entry.max, duration) : duration;

    const newEntry: PluginPerfEntry = { last: duration, avg, max, samples };

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
      if (import.meta.env.DEV) {
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

export class Perf {
  static paths = perf;

  static configure(config: Partial<PerfConfig>): Pipe {
    return Events.dispatch({
      type: eventType.configure,
      payload: config,
    });
  }

  static onOverBudget(fn: (event: GameEvent) => Pipe): Pipe {
    return Events.handle(eventType.overBudget, fn);
  }
}

export const perfPipe: Pipe = Composer.pipe(
  Composer.over<PerfContext>(
    perf.context,
    (ctx = { plugins: {}, config: DEFAULT_CONFIG }) => ({
      ...ctx,
      plugins: ctx.plugins ?? {},
      config: ctx.config ?? DEFAULT_CONFIG,
    })
  ),
  Events.handle(eventType.configure, event =>
    Composer.over<PerfContext>(perf.context, ctx => ({
      ...ctx,
      config: {
        ...ctx.config,
        ...(event.payload as Partial<PerfConfig>),
      },
    }))
  )
);
