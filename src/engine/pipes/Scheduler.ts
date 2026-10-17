import { Composer } from '../Composer';
import { typedPath } from '../Lens';
import { pluginPaths } from '../plugins/Plugins';
import { GameFrame, GameTiming, Pipe } from '../State';
import { Events, GameEvent } from './Events';
import { Log } from './Log';

const PLUGIN_NAMESPACE = 'core.scheduler';

export const ENGINE_TIMELINE = 'engine';

export type ScheduledEvent = {
  id?: string;
  duration: number;
  event: GameEvent;
  held?: boolean;
  timeline?: string;
};

export type RateChange = {
  timeline: string;
  from: number;
  to: number;
};

type SchedulerState = {
  scheduled: ScheduledEvent[];
  current: GameEvent[];
  rates: Record<string, number>;
  fired: ScheduledEvent[];
  handling: ScheduledEvent[];
};

const scheduler = pluginPaths<SchedulerState>(PLUGIN_NAMESPACE);
const timing = typedPath<GameTiming>([]);

const eventType = Events.getKeys(
  PLUGIN_NAMESPACE,
  'schedule',
  'cancel',
  'hold',
  'release',
  'hold_by_prefix',
  'release_by_prefix',
  'cancel_by_prefix',
  'restore',
  'set_rate',
  'remove_timeline',
  'rate_changed'
);

const COMMAND_PREFIX = `${PLUGIN_NAMESPACE}/`;

const warned = new Set<string>();

const rateOf = (
  timeline: string | undefined,
  rates: Record<string, number>
): number => {
  if (!timeline || timeline === ENGINE_TIMELINE) return 1;
  return rates[timeline] ?? 0;
};

const isEntry = (value: unknown): value is ScheduledEvent =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ScheduledEvent).id === 'string' &&
  Number.isFinite((value as ScheduledEvent).duration) &&
  (value as ScheduledEvent).duration >= 0 &&
  typeof (value as ScheduledEvent).event?.type === 'string';

const underPrefix = (prefix: string) => (entry: ScheduledEvent) =>
  entry.id?.startsWith(prefix) ?? false;

const mark = (
  list: ScheduledEvent[],
  match: (entry: ScheduledEvent) => boolean,
  held: boolean
) => list.map(entry => (match(entry) ? { ...entry, held } : entry));

function apply(list: ScheduledEvent[], command: GameEvent): ScheduledEvent[] {
  switch (command.type) {
    case eventType.schedule: {
      const entry = command.payload as ScheduledEvent;
      return [...list.filter(e => e.id !== entry.id), entry];
    }
    case eventType.cancel:
      return list.filter(e => e.id !== command.payload);
    case eventType.cancelByPrefix:
      return list.filter(e => !underPrefix(command.payload)(e));
    case eventType.hold:
      return mark(list, e => e.id === command.payload, true);
    case eventType.release:
      return mark(list, e => e.id === command.payload, false);
    case eventType.holdByPrefix:
      return mark(list, underPrefix(command.payload), true);
    case eventType.releaseByPrefix:
      return mark(list, underPrefix(command.payload), false);
    case eventType.restore: {
      const { prefix, entries } = command.payload as {
        prefix: string;
        entries: ScheduledEvent[];
      };
      const byId = new Map<string, ScheduledEvent>();
      for (const entry of entries ?? []) {
        if (isEntry(entry) && underPrefix(prefix)(entry)) {
          byId.set(entry.id!, entry);
        }
      }
      return [...list.filter(e => !underPrefix(prefix)(e)), ...byId.values()];
    }
    default:
      return list;
  }
}

const isCommand = (event: GameEvent) =>
  event.type.startsWith(COMMAND_PREFIX) &&
  event.type !== eventType.setRate &&
  event.type !== eventType.removeTimeline &&
  event.type !== eventType.rateChanged;

export class Scheduler {
  static readonly ENGINE_TIMELINE = ENGINE_TIMELINE;

  static getKey(namespace: string, key: string): string {
    return `${namespace}/schedule/${key}`;
  }

  // These API methods are events to ensure they dont have weird ordering problems.
  // TODO: re-evaluate this decision

  static schedule(event: ScheduledEvent): Pipe {
    return Events.dispatch({ type: eventType.schedule, payload: event });
  }

  static cancel(id: string): Pipe {
    return Events.dispatch({ type: eventType.cancel, payload: id });
  }

  static hold(id: string): Pipe {
    return Events.dispatch({ type: eventType.hold, payload: id });
  }

  static release(id: string): Pipe {
    return Events.dispatch({ type: eventType.release, payload: id });
  }

  static holdByPrefix(prefix: string): Pipe {
    return Events.dispatch({ type: eventType.holdByPrefix, payload: prefix });
  }

  static releaseByPrefix(prefix: string): Pipe {
    return Events.dispatch({
      type: eventType.releaseByPrefix,
      payload: prefix,
    });
  }

  static cancelByPrefix(prefix: string): Pipe {
    return Events.dispatch({ type: eventType.cancelByPrefix, payload: prefix });
  }

  static setRate(timeline: string, rate: number): Pipe {
    return Events.dispatch({
      type: eventType.setRate,
      payload: { timeline, rate },
    });
  }

  static removeTimeline(timeline: string): Pipe {
    return Events.dispatch({
      type: eventType.removeTimeline,
      payload: timeline,
    });
  }

  static remaining(frame: GameFrame, idOrPrefix: string): number | undefined {
    const scheduled = Composer.get(scheduler.scheduled)(frame) ?? [];
    return scheduled.find(entry => entry.id?.startsWith(idOrPrefix))?.duration;
  }

  static snapshot(frame: GameFrame, prefix: string): ScheduledEvent[] {
    const state = Composer.get(scheduler)(frame);
    const byId = new Map<string, ScheduledEvent>();
    for (const entry of [
      ...(state?.handling ?? []),
      ...(state?.fired ?? []),
      ...(state?.scheduled ?? []),
    ]) {
      if (entry.id !== undefined) byId.set(entry.id, entry);
    }
    let list = [...byId.values()];
    for (const command of Events.pending(frame)) {
      if (isCommand(command)) list = apply(list, command);
    }
    return list.filter(underPrefix(prefix));
  }

  static restore(prefix: string, entries: ScheduledEvent[]): Pipe {
    return Events.dispatch({
      type: eventType.restore,
      payload: { prefix, entries },
    });
  }

  static onRate(timeline: string, fn: (change: RateChange) => Pipe): Pipe {
    return Events.handle<RateChange>(eventType.rateChanged, event =>
      event.payload.timeline === timeline ? fn(event.payload) : frame => frame
    );
  }

  static onStop(timeline: string, fn: () => Pipe): Pipe {
    return Scheduler.onRate(timeline, ({ to }) =>
      to === 0 ? fn() : frame => frame
    );
  }

  static onStart(timeline: string, fn: () => Pipe): Pipe {
    return Scheduler.onRate(timeline, ({ from }) =>
      from === 0 ? fn() : frame => frame
    );
  }

  static get paths() {
    return scheduler;
  }

  static pipe: Pipe = Composer.pipe(
    Composer.bind(timing.step, delta =>
      Composer.over(
        scheduler,
        ({ scheduled = [], rates = {}, fired = [], ...rest }) => {
          const remaining: ScheduledEvent[] = [];
          const current: GameEvent[] = [];
          const firing: ScheduledEvent[] = [];

          for (const entry of scheduled) {
            if (entry.held) {
              remaining.push(entry);
              continue;
            }
            const time = entry.duration - delta * rateOf(entry.timeline, rates);
            if (time <= 0) {
              current.push(entry.event);
              firing.push({ ...entry, duration: 0 });
            } else {
              remaining.push({ ...entry, duration: time });
            }
          }

          return {
            ...rest,
            scheduled: remaining,
            current,
            rates,
            fired: firing,
            handling: fired,
          };
        }
      )
    ),

    Composer.bind(scheduler.current, events =>
      Composer.pipe(...events.map(Events.dispatch))
    ),

    Events.handle(Events.getKey(PLUGIN_NAMESPACE, '*'), event =>
      Composer.do(({ get, set, over, pipe }) => {
        switch (event.type) {
          case eventType.setRate: {
            const { timeline, rate } = event.payload as {
              timeline: string;
              rate: number;
            };
            if (timeline === ENGINE_TIMELINE) return;
            if (!Number.isFinite(rate) || rate < 0) {
              pipe(
                Log.warn(
                  PLUGIN_NAMESPACE,
                  'ignored rate {rate} for {timeline}',
                  { rate: String(rate), timeline }
                )
              );
              return;
            }
            const rates = get(scheduler.rates) ?? {};
            const from = rates[timeline] ?? 0;
            set(scheduler.rates, { ...rates, [timeline]: rate });
            if (from === rate) return;
            pipe(
              Events.dispatch({
                type: eventType.rateChanged,
                payload: { timeline, from, to: rate },
              })
            );
            return;
          }
          case eventType.removeTimeline: {
            const timeline = event.payload as string;
            if (timeline === ENGINE_TIMELINE) return;
            const rates = { ...(get(scheduler.rates) ?? {}) };
            const from = rates[timeline] ?? 0;
            delete rates[timeline];
            set(scheduler.rates, rates);
            if (from === 0) return;
            pipe(
              Events.dispatch({
                type: eventType.rateChanged,
                payload: { timeline, from, to: 0 },
              })
            );
            return;
          }
          case eventType.rateChanged:
            return;
          case eventType.schedule: {
            const { timeline } = event.payload as ScheduledEvent;
            if (
              import.meta.env.DEV &&
              timeline &&
              timeline !== ENGINE_TIMELINE &&
              !(timeline in (get(scheduler.rates) ?? {})) &&
              !warned.has(timeline)
            ) {
              warned.add(timeline);
              pipe(
                Log.warn(
                  PLUGIN_NAMESPACE,
                  'timeline {timeline} has no rate set',
                  { timeline }
                )
              );
            }
            over(scheduler.scheduled, list => apply(list ?? [], event));
            return;
          }
          case eventType.restore: {
            const { prefix, entries } = event.payload as {
              prefix: string;
              entries: ScheduledEvent[];
            };
            const dropped = (entries ?? []).filter(
              entry => !(isEntry(entry) && underPrefix(prefix)(entry))
            ).length;
            if (dropped > 0) {
              pipe(
                Log.warn(
                  PLUGIN_NAMESPACE,
                  'dropped {count} restored entries outside {prefix}',
                  { count: String(dropped), prefix }
                )
              );
            }
            over(scheduler.scheduled, list => apply(list ?? [], event));
            return;
          }
          default:
            over(scheduler.scheduled, list => apply(list ?? [], event));
        }
      })
    )
  );
}
