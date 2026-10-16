import { Composer } from '../Composer';
import { typedPath } from '../Lens';
import { pluginPaths } from '../plugins/Plugins';
import { GameTiming, Pipe } from '../State';
import { registry } from '../registry';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogEntry = {
  level: LogLevel;
  source: string;
  message: string;
  data?: Record<string, unknown>;
  tick: number;
  time: number;
};

type LogLine = { type: string; payload: LogEntry };

export const LOG_LINE = 'core.log/line';
export const LOG_CAPACITY = 200;
export const PRINTED_CAPACITY = 500;

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const PLACEHOLDER = /\{([A-Za-z_$][\w$]*)\}/g;

const effects = pluginPaths<{ queue: LogLine[] }>('core.effects');
const timing = typedPath<GameTiming>([]);

const ring: LogEntry[] = [];
const printed = new Set<string>();

function line(
  level: LogLevel,
  source: string,
  message: string,
  data?: Record<string, unknown>
): Pipe {
  return Composer.do(({ get, over }) => {
    const entry: LogEntry = {
      level,
      source,
      message,
      ...(data !== undefined && { data }),
      tick: get(timing.tick) ?? 0,
      time: get(timing.time) ?? 0,
    };
    over(
      effects.queue,
      queue => [...queue, { type: LOG_LINE, payload: entry }],
      []
    );
  });
}

export function render(entry: LogEntry): string {
  const data = entry.data ?? {};
  return entry.message.replace(PLACEHOLDER, (match, name) =>
    name in data ? String(data[name]) : match
  );
}

function remember(key: string) {
  printed.add(key);
  if (printed.size > PRINTED_CAPACITY) {
    const oldest = printed.values().next().value;
    if (oldest !== undefined) printed.delete(oldest);
  }
}

function print(entry: LogEntry) {
  const key = `${entry.level}|${entry.source}|${entry.message}`;
  const loud = LEVEL_RANK[entry.level] >= LEVEL_RANK.warn;
  const first = !printed.has(key);
  if (!(registry.debug || (loud && first))) return;
  remember(key);

  const text = `[${entry.source}] ${render(entry)}`;
  const named = new Set<string>();
  for (const match of entry.message.matchAll(PLACEHOLDER)) named.add(match[1]);
  const rest = Object.fromEntries(
    Object.entries(entry.data ?? {}).filter(([key]) => !named.has(key))
  );
  const args = Object.keys(rest).length === 0 ? [text] : [text, rest];
  if (entry.level === 'error') console.error(...args);
  else if (entry.level === 'warn') console.warn(...args);
  else console.log(...args);
}

export class Log {
  static debug(
    source: string,
    message: string,
    data?: Record<string, unknown>
  ): Pipe {
    return line('debug', source, message, data);
  }

  static info(
    source: string,
    message: string,
    data?: Record<string, unknown>
  ): Pipe {
    return line('info', source, message, data);
  }

  static warn(
    source: string,
    message: string,
    data?: Record<string, unknown>
  ): Pipe {
    return line('warn', source, message, data);
  }

  static error(
    source: string,
    message: string,
    data?: Record<string, unknown>
  ): Pipe {
    return line('error', source, message, data);
  }

  static perform(entry: LogEntry): void {
    ring.push(entry);
    if (ring.length > LOG_CAPACITY) ring.shift();
    print(entry);
  }

  static entries(): readonly LogEntry[] {
    return ring;
  }

  static clear(): void {
    ring.length = 0;
    printed.clear();
  }
}

declare module '../sdk' {
  interface SDK {
    Log: typeof Log;
  }
}

registry.Log = Log;
