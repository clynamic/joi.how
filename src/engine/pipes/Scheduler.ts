import { Composer } from '../Composer';
import { Pipe, PipeTransformer } from '../State';
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

export type SchedulerContext = {
  schedule: PipeTransformer<[ScheduledEvent]>;
  cancel: PipeTransformer<[string]>;
  hold: PipeTransformer<[string]>;
  release: PipeTransformer<[string]>;
  holdByPrefix: PipeTransformer<[string]>;
  releaseByPrefix: PipeTransformer<[string]>;
  cancelByPrefix: PipeTransformer<[string]>;
};

export class Scheduler {
  static schedule(event: ScheduledEvent): Pipe {
    return Composer.bind<SchedulerContext>(
      ['context', PLUGIN_NAMESPACE],
      ({ schedule }) => schedule(event)
    );
  }

  static cancel(id: string): Pipe {
    return Composer.bind<SchedulerContext>(
      ['context', PLUGIN_NAMESPACE],
      ({ cancel }) => cancel(id)
    );
  }

  static hold(id: string): Pipe {
    return Composer.bind<SchedulerContext>(
      ['context', PLUGIN_NAMESPACE],
      ({ hold }) => hold(id)
    );
  }

  static release(id: string): Pipe {
    return Composer.bind<SchedulerContext>(
      ['context', PLUGIN_NAMESPACE],
      ({ release }) => release(id)
    );
  }

  static holdByPrefix(prefix: string): Pipe {
    return Composer.bind<SchedulerContext>(
      ['context', PLUGIN_NAMESPACE],
      ({ holdByPrefix }) => holdByPrefix(prefix)
    );
  }

  static releaseByPrefix(prefix: string): Pipe {
    return Composer.bind<SchedulerContext>(
      ['context', PLUGIN_NAMESPACE],
      ({ releaseByPrefix }) => releaseByPrefix(prefix)
    );
  }

  static cancelByPrefix(prefix: string): Pipe {
    return Composer.bind<SchedulerContext>(
      ['context', PLUGIN_NAMESPACE],
      ({ cancelByPrefix }) => cancelByPrefix(prefix)
    );
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

  Composer.set<SchedulerContext>(['context', PLUGIN_NAMESPACE], {
    schedule: (e: ScheduledEvent) =>
      Events.dispatch({
        type: getEventKey(PLUGIN_NAMESPACE, 'schedule'),
        payload: e,
      }),

    cancel: (id: string) =>
      Events.dispatch({
        type: getEventKey(PLUGIN_NAMESPACE, 'cancel'),
        payload: id,
      }),

    hold: (id: string) =>
      Events.dispatch({
        type: getEventKey(PLUGIN_NAMESPACE, 'hold'),
        payload: id,
      }),

    release: (id: string) =>
      Events.dispatch({
        type: getEventKey(PLUGIN_NAMESPACE, 'release'),
        payload: id,
      }),

    holdByPrefix: (prefix: string) =>
      Events.dispatch({
        type: getEventKey(PLUGIN_NAMESPACE, 'holdByPrefix'),
        payload: prefix,
      }),

    releaseByPrefix: (prefix: string) =>
      Events.dispatch({
        type: getEventKey(PLUGIN_NAMESPACE, 'releaseByPrefix'),
        payload: prefix,
      }),

    cancelByPrefix: (prefix: string) =>
      Events.dispatch({
        type: getEventKey(PLUGIN_NAMESPACE, 'cancelByPrefix'),
        payload: prefix,
      }),
  }),

  Events.handle(getEventKey(PLUGIN_NAMESPACE, 'schedule'), event =>
    Composer.over<ScheduledEvent[]>(
      ['state', PLUGIN_NAMESPACE, 'scheduled'],
      (list = []) => [
        ...list.filter(e => e.id !== event.payload.id),
        event.payload,
      ]
    )
  ),

  Events.handle(getEventKey(PLUGIN_NAMESPACE, 'cancel'), event =>
    Composer.over<ScheduledEvent[]>(
      ['state', PLUGIN_NAMESPACE, 'scheduled'],
      (list = []) => list.filter(s => s.id !== event.payload)
    )
  ),

  Events.handle(getEventKey(PLUGIN_NAMESPACE, 'hold'), event =>
    Composer.over<ScheduledEvent[]>(
      ['state', PLUGIN_NAMESPACE, 'scheduled'],
      (list = []) =>
        list.map(s => (s.id === event.payload ? { ...s, held: true } : s))
    )
  ),

  Events.handle(getEventKey(PLUGIN_NAMESPACE, 'release'), event =>
    Composer.over<ScheduledEvent[]>(
      ['state', PLUGIN_NAMESPACE, 'scheduled'],
      (list = []) =>
        list.map(s => (s.id === event.payload ? { ...s, held: false } : s))
    )
  ),

  Events.handle(getEventKey(PLUGIN_NAMESPACE, 'holdByPrefix'), event =>
    Composer.over<ScheduledEvent[]>(
      ['state', PLUGIN_NAMESPACE, 'scheduled'],
      (list = []) =>
        list.map(s =>
          s.id?.startsWith(event.payload) ? { ...s, held: true } : s
        )
    )
  ),

  Events.handle(getEventKey(PLUGIN_NAMESPACE, 'releaseByPrefix'), event =>
    Composer.over<ScheduledEvent[]>(
      ['state', PLUGIN_NAMESPACE, 'scheduled'],
      (list = []) =>
        list.map(s =>
          s.id?.startsWith(event.payload) ? { ...s, held: false } : s
        )
    )
  ),

  Events.handle(getEventKey(PLUGIN_NAMESPACE, 'cancelByPrefix'), event =>
    Composer.over<ScheduledEvent[]>(
      ['state', PLUGIN_NAMESPACE, 'scheduled'],
      (list = []) => list.filter(s => !s.id?.startsWith(event.payload))
    )
  )
);
