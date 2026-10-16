import { Composer } from '../Composer';
import { typedPath } from '../Lens';
import { pluginPaths } from '../plugins/Plugins';
import { GameTiming, Pipe } from '../State';
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
  'set_rate',
  'remove_timeline',
  'rate_changed'
);

const warned = new Set<string>();

const rateOf = (
  timeline: string | undefined,
  rates: Record<string, number>
): number => {
  if (!timeline || timeline === ENGINE_TIMELINE) return 1;
  return rates[timeline] ?? 1;
};

export class Scheduler {
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
      Composer.over(scheduler, ({ scheduled = [], rates = {}, ...rest }) => {
        const remaining: ScheduledEvent[] = [];
        const current: GameEvent[] = [];

        for (const entry of scheduled) {
          if (entry.held) {
            remaining.push(entry);
            continue;
          }
          const time = entry.duration - delta * rateOf(entry.timeline, rates);
          if (time <= 0) {
            current.push(entry.event);
          } else {
            remaining.push({ ...entry, duration: time });
          }
        }

        return { ...rest, scheduled: remaining, current, rates };
      })
    ),

    Composer.bind(scheduler.current, events =>
      Composer.pipe(...events.map(Events.dispatch))
    ),

    Events.handle<{ timeline: string; rate: number }>(
      eventType.setRate,
      event =>
        Composer.do(({ get, set, pipe }) => {
          const { timeline, rate } = event.payload;
          if (timeline === ENGINE_TIMELINE) return;
          if (!Number.isFinite(rate) || rate < 0) {
            pipe(
              Log.warn(PLUGIN_NAMESPACE, 'ignored rate {rate} for {timeline}', {
                rate: String(rate),
                timeline,
              })
            );
            return;
          }
          const rates = get(scheduler.rates) ?? {};
          const from = rates[timeline] ?? 1;
          set(scheduler.rates, { ...rates, [timeline]: rate });
          if (from === rate) return;
          pipe(
            Events.dispatch({
              type: eventType.rateChanged,
              payload: { timeline, from, to: rate },
            })
          );
        })
    ),

    Events.handle<string>(eventType.removeTimeline, event =>
      Composer.do(({ get, set }) => {
        const timeline = event.payload;
        if (timeline === ENGINE_TIMELINE) return;
        const rates = { ...(get(scheduler.rates) ?? {}) };
        delete rates[timeline];
        set(scheduler.rates, rates);
        set(
          scheduler.scheduled,
          (get(scheduler.scheduled) ?? []).filter(s => s.timeline !== timeline)
        );
      })
    ),

    Events.handle<ScheduledEvent>(eventType.schedule, event =>
      Composer.do(({ get, over, pipe }) => {
        const { timeline } = event.payload;
        if (
          import.meta.env.DEV &&
          timeline &&
          timeline !== ENGINE_TIMELINE &&
          !(timeline in (get(scheduler.rates) ?? {})) &&
          !warned.has(timeline)
        ) {
          warned.add(timeline);
          pipe(
            Log.warn(PLUGIN_NAMESPACE, 'timeline {timeline} has no rate set', {
              timeline,
            })
          );
        }
        over(scheduler.scheduled, list => [
          ...list.filter(e => e.id !== event.payload.id),
          event.payload,
        ]);
      })
    ),

    Events.handle<string>(eventType.cancel, event =>
      Composer.over(scheduler.scheduled, list =>
        list.filter(s => s.id !== event.payload)
      )
    ),

    Events.handle<string>(eventType.hold, event =>
      Composer.over(scheduler.scheduled, list =>
        list.map(s => (s.id === event.payload ? { ...s, held: true } : s))
      )
    ),

    Events.handle<string>(eventType.release, event =>
      Composer.over(scheduler.scheduled, list =>
        list.map(s => (s.id === event.payload ? { ...s, held: false } : s))
      )
    ),

    Events.handle<string>(eventType.holdByPrefix, event =>
      Composer.over(scheduler.scheduled, list =>
        list.map(s =>
          s.id?.startsWith(event.payload) ? { ...s, held: true } : s
        )
      )
    ),

    Events.handle<string>(eventType.releaseByPrefix, event =>
      Composer.over(scheduler.scheduled, list =>
        list.map(s =>
          s.id?.startsWith(event.payload) ? { ...s, held: false } : s
        )
      )
    ),

    Events.handle<string>(eventType.cancelByPrefix, event =>
      Composer.over(scheduler.scheduled, list =>
        list.filter(s => !s.id?.startsWith(event.payload))
      )
    )
  );
}
