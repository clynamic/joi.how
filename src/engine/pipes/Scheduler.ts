import { Composer } from '../Composer';
import { typedPath } from '../Lens';
import { pluginPaths } from '../plugins/Plugins';
import { GameTiming, Pipe } from '../State';
import { Events, GameEvent } from './Events';

const PLUGIN_NAMESPACE = 'core.scheduler';

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

const scheduler = pluginPaths<SchedulerState>(PLUGIN_NAMESPACE);
const timing = typedPath<GameTiming>(['context']);

const eventType = Events.getKeys(
  PLUGIN_NAMESPACE,
  'schedule',
  'cancel',
  'hold',
  'release',
  'hold_by_prefix',
  'release_by_prefix',
  'cancel_by_prefix'
);

export class Scheduler {
  static getKey(namespace: string, key: string): string {
    return `${namespace}/schedule/${key}`;
  }

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

  static pipe: Pipe = Composer.pipe(
    Composer.bind(timing.step, delta =>
      Composer.over(scheduler.state, ({ scheduled = [] }) => {
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
      })
    ),

    Composer.bind(scheduler.state.current, events =>
      Composer.pipe(...events.map(Events.dispatch))
    ),

    Events.handle<ScheduledEvent>(eventType.schedule, event =>
      Composer.over(scheduler.state.scheduled, (list = []) => [
        ...list.filter(e => e.id !== event.payload.id),
        event.payload,
      ])
    ),

    Events.handle<string>(eventType.cancel, event =>
      Composer.over(scheduler.state.scheduled, (list = []) =>
        list.filter(s => s.id !== event.payload)
      )
    ),

    Events.handle<string>(eventType.hold, event =>
      Composer.over(scheduler.state.scheduled, (list = []) =>
        list.map(s => (s.id === event.payload ? { ...s, held: true } : s))
      )
    ),

    Events.handle<string>(eventType.release, event =>
      Composer.over(scheduler.state.scheduled, (list = []) =>
        list.map(s => (s.id === event.payload ? { ...s, held: false } : s))
      )
    ),

    Events.handle<string>(eventType.holdByPrefix, event =>
      Composer.over(scheduler.state.scheduled, (list = []) =>
        list.map(s =>
          s.id?.startsWith(event.payload) ? { ...s, held: true } : s
        )
      )
    ),

    Events.handle<string>(eventType.releaseByPrefix, event =>
      Composer.over(scheduler.state.scheduled, (list = []) =>
        list.map(s =>
          s.id?.startsWith(event.payload) ? { ...s, held: false } : s
        )
      )
    ),

    Events.handle<string>(eventType.cancelByPrefix, event =>
      Composer.over(scheduler.state.scheduled, (list = []) =>
        list.filter(s => !s.id?.startsWith(event.payload))
      )
    )
  );
}
