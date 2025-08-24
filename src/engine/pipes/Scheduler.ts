import { Composer } from '../Composer';
import { Pipe, PipeTransformer } from '../State';
import { EventContext, GameEvent, getEventKey } from './Events';

const PLUGIN_NAMESPACE = 'core.scheduler';

export const getScheduleKey = (namespace: string, key: string): string => {
  return `${namespace}/schedule/${key}`;
};

export type ScheduledEvent = {
  id?: string;
  duration: number;
  event: GameEvent;
};

type SchedulerState = {
  scheduled: ScheduledEvent[];
  current: GameEvent[];
};

export type SchedulerContext = {
  schedule: PipeTransformer<[ScheduledEvent]>;
  cancel: PipeTransformer<[string]>;
};

export const schedulerPipe: Pipe = Composer.chain(c => {
  const { dispatch, handle } = c.get<EventContext>([
    'context',
    'core',
    'events',
  ]);

  return c
    .bind<number>(['context', 'deltaTime'], delta =>
      Composer.over<SchedulerState>(
        ['state', PLUGIN_NAMESPACE],
        ({ scheduled = [] }) => {
          const remaining: ScheduledEvent[] = [];
          const current: GameEvent[] = [];

          for (const entry of scheduled) {
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
    )
    .bind<GameEvent[]>(['state', PLUGIN_NAMESPACE, 'current'], events =>
      Composer.pipe(...events.map(dispatch))
    )

    .set<SchedulerContext>(['context', PLUGIN_NAMESPACE], {
      schedule: (e: ScheduledEvent) =>
        Composer.pipe(
          dispatch({
            type: getEventKey(PLUGIN_NAMESPACE, 'schedule'),
            payload: e,
          })
        ),

      cancel: (id: string) =>
        Composer.pipe(
          dispatch({
            type: getEventKey(PLUGIN_NAMESPACE, 'cancel'),
            payload: id,
          })
        ),
    })

    .pipe(
      handle(getEventKey(PLUGIN_NAMESPACE, 'schedule'), event =>
        Composer.over<ScheduledEvent[]>(
          ['state', PLUGIN_NAMESPACE, 'scheduled'],
          (list = []) => [
            ...list.filter(e => e.id !== event.payload.id),
            event.payload,
          ]
        )
      )
    )

    .pipe(
      handle(getEventKey(PLUGIN_NAMESPACE, 'cancel'), event =>
        Composer.over<ScheduledEvent[]>(
          ['state', PLUGIN_NAMESPACE, 'scheduled'],
          (list = []) => list.filter(s => s.id !== event.payload)
        )
      )
    );
});
