import { Composer } from '../Composer';
import { Pipe, PipeTransformer } from '../State';
import { EventContext, GameEvent, getEventKey } from './Events';

const PLUGIN_NAMESPACE = 'core.scheduler';

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

export const schedulerPipe: Pipe = Composer.build(c => {
  const { dispatch, handle } = c.get<EventContext>([
    'context',
    'core',
    'events',
  ]);

  return c
    .bind<number>(
      ['context', 'deltaTime'],
      delta => c =>
        c.over<SchedulerState>(
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
    .bind<GameEvent[]>(
      ['state', PLUGIN_NAMESPACE, 'current'],
      events => c => c.pipe(...events.map(dispatch))
    )

    .set<SchedulerContext>(['context', PLUGIN_NAMESPACE], {
      schedule: (e: ScheduledEvent) =>
        Composer.build(c =>
          c.apply(dispatch, {
            type: getEventKey(PLUGIN_NAMESPACE, 'schedule'),
            payload: e,
          })
        ),

      cancel: (id: string) =>
        Composer.build(c =>
          c.apply(dispatch, {
            type: getEventKey(PLUGIN_NAMESPACE, 'cancel'),
            payload: id,
          })
        ),
    })

    .apply(handle, getEventKey(PLUGIN_NAMESPACE, 'schedule'), event =>
      Composer.build(c =>
        c.over<ScheduledEvent[]>(
          ['state', PLUGIN_NAMESPACE, 'scheduled'],
          (list = []) => [...list, event.payload]
        )
      )
    )

    .apply(handle, getEventKey(PLUGIN_NAMESPACE, 'cancel'), event =>
      Composer.build(c =>
        c.over<ScheduledEvent[]>(
          ['state', PLUGIN_NAMESPACE, 'scheduled'],
          (list = []) => list.filter(s => s.id !== event.payload)
        )
      )
    );
});
