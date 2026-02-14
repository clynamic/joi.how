import { Composer } from '../Composer';
import { Pipe } from '../State';
import { Events, GameEvent, getEventKey } from './Events';

const PLUGIN_NAMESPACE = 'core.scheduler';

export const getScheduleKey = (namespace: string, key: string): string => {
  return `${namespace}/schedule/${key}`;
};

export type ScheduledEvent = {
  id?: string;
  duration: number;
  event: GameEvent;
  held?: boolean;
};

type SchedulerState = {
  scheduled: ScheduledEvent[];
  current: GameEvent[];
};

const eventType = {
  schedule: getEventKey(PLUGIN_NAMESPACE, 'schedule'),
  cancel: getEventKey(PLUGIN_NAMESPACE, 'cancel'),
  hold: getEventKey(PLUGIN_NAMESPACE, 'hold'),
  release: getEventKey(PLUGIN_NAMESPACE, 'release'),
  holdByPrefix: getEventKey(PLUGIN_NAMESPACE, 'holdByPrefix'),
  releaseByPrefix: getEventKey(PLUGIN_NAMESPACE, 'releaseByPrefix'),
  cancelByPrefix: getEventKey(PLUGIN_NAMESPACE, 'cancelByPrefix'),
};

export class Scheduler {
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
    return Events.dispatch({ type: eventType.releaseByPrefix, payload: prefix });
  }

  static cancelByPrefix(prefix: string): Pipe {
    return Events.dispatch({ type: eventType.cancelByPrefix, payload: prefix });
  }
}

export const schedulerPipe: Pipe = Composer.pipe(
  Composer.bind<number>(['context', 'deltaTime'], delta =>
    Composer.over<SchedulerState>(
      ['state', PLUGIN_NAMESPACE],
      ({ scheduled = [] }) => {
        const remaining: ScheduledEvent[] = [];
        const current: GameEvent[] = [];

        for (const entry of scheduled) {
          if (entry.held) {
            remaining.push(entry);
            continue;
          }
          const time = entry.duration - delta;
          if (time <= 0) {
            current.push(entry.event);
          } else {
            remaining.push({ ...entry, duration: time });
          }
        }

        return { scheduled: remaining, current };
      }
    )
  ),

  Composer.bind<GameEvent[]>(['state', PLUGIN_NAMESPACE, 'current'], events =>
    Composer.pipe(...events.map(Events.dispatch))
  ),

  Events.handle(eventType.schedule, event =>
    Composer.over<ScheduledEvent[]>(
      ['state', PLUGIN_NAMESPACE, 'scheduled'],
      (list = []) => [
        ...list.filter(e => e.id !== event.payload.id),
        event.payload,
      ]
    )
  ),

  Events.handle(eventType.cancel, event =>
    Composer.over<ScheduledEvent[]>(
      ['state', PLUGIN_NAMESPACE, 'scheduled'],
      (list = []) => list.filter(s => s.id !== event.payload)
    )
  ),

  Events.handle(eventType.hold, event =>
    Composer.over<ScheduledEvent[]>(
      ['state', PLUGIN_NAMESPACE, 'scheduled'],
      (list = []) =>
        list.map(s => (s.id === event.payload ? { ...s, held: true } : s))
    )
  ),

  Events.handle(eventType.release, event =>
    Composer.over<ScheduledEvent[]>(
      ['state', PLUGIN_NAMESPACE, 'scheduled'],
      (list = []) =>
        list.map(s => (s.id === event.payload ? { ...s, held: false } : s))
    )
  ),

  Events.handle(eventType.holdByPrefix, event =>
    Composer.over<ScheduledEvent[]>(
      ['state', PLUGIN_NAMESPACE, 'scheduled'],
      (list = []) =>
        list.map(s =>
          s.id?.startsWith(event.payload) ? { ...s, held: true } : s
        )
    )
  ),

  Events.handle(eventType.releaseByPrefix, event =>
    Composer.over<ScheduledEvent[]>(
      ['state', PLUGIN_NAMESPACE, 'scheduled'],
      (list = []) =>
        list.map(s =>
          s.id?.startsWith(event.payload) ? { ...s, held: false } : s
        )
    )
  ),

  Events.handle(eventType.cancelByPrefix, event =>
    Composer.over<ScheduledEvent[]>(
      ['state', PLUGIN_NAMESPACE, 'scheduled'],
      (list = []) => list.filter(s => !s.id?.startsWith(event.payload))
    )
  )
);
