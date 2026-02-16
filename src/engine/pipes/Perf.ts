import { Composer } from '../Composer';
import { GameContext, Pipe } from '../State';
import { Events, type GameEvent } from './Events';
import { pluginPaths, PluginId } from '../plugins/Plugins';
import { typedPath } from '../Lens';
import { sdk } from '../sdk';

declare module '../sdk' {
  interface SDK {
    Perf: typeof Perf;
  }
}

export type PluginPerfEntry = {
  last: number;
  avg: number;
  max: number;
  samples: number[];
  lastTick: number;
};

export type PerfMetrics = Record<PluginId, Record<string, PluginPerfEntry>>;

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

type OverBudgetPayload = {
  id: string;
  phase: string;
  duration: number;
  budget: number;
};

const eventType = Events.getKeys(PLUGIN_NAMESPACE, 'over_budget', 'configure');

const perf = pluginPaths<never, PerfContext>(PLUGIN_NAMESPACE);
const gameContext = typedPath<GameContext>(['context']);

function isEntry(value: unknown): value is PluginPerfEntry {
  return value != null && typeof value === 'object' && 'lastTick' in value;
}

function pruneExpired(
  node: Record<string, unknown>,
  tick: number
): [Record<string, unknown> | undefined, boolean] {
  let dirty = false;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(node)) {
    if (isEntry(value)) {
      if (tick - value.lastTick <= EXPIRY_TICKS) {
        result[key] = value;
      } else {
        dirty = true;
      }
    } else if (value && typeof value === 'object') {
      const [pruned, changed] = pruneExpired(
        value as Record<string, unknown>,
        tick
      );
      if (pruned) result[key] = pruned;
      else dirty = true;
      if (changed) dirty = true;
    }
  }

  const empty = Object.keys(result).length === 0;
  return [empty ? undefined : result, dirty];
}

export class Perf {
  static withTiming(id: PluginId, phase: string, pluginPipe: Pipe): Pipe {
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
      const entryPath = perf.context.plugins[id][phase];
      const entry = get<PluginPerfEntry>(entryPath);

      const samples = entry
        ? [...entry.samples, duration].slice(-SAMPLE_SIZE)
        : [duration];

      const avg = samples.reduce((sum, v) => sum + v, 0) / samples.length;
      const max = entry ? Math.max(entry.max, duration) : duration;

      set(entryPath, { last: duration, avg, max, samples, lastTick: tick });

      const budget =
        get<number>(perf.context.config.pluginBudget) ??
        DEFAULT_CONFIG.pluginBudget;

      if (duration > budget) {
        console.warn(
          `[perf] ${id} ${phase} took ${duration.toFixed(2)}ms (budget: ${budget}ms)`
        );
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
    Composer.do(({ get, set }) => {
      if (!get(perf.context.config)) {
        set(perf.context.config, DEFAULT_CONFIG);
      }
    }),

    Composer.do(({ get, set }) => {
      const tick = get(gameContext.tick) ?? 0;
      const plugins = get<Record<string, unknown>>(perf.context.plugins);
      if (!plugins) return;

      const [pruned, dirty] = pruneExpired(plugins, tick);
      if (dirty) {
        set(perf.context.plugins, pruned ?? {});
      }
    }),

    Events.handle<Partial<PerfConfig>>(eventType.configure, event =>
      Composer.over(
        perf.context.config,
        (config = DEFAULT_CONFIG) => ({
          ...config,
          ...event.payload,
        })
      )
    )
  );

  static get paths() {
    return perf;
  }
}

sdk.Perf = Perf;
