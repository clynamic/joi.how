import { Composer, Transformer } from '../Composer';
import { GameContext, Pipe } from '../State';
import {
  EventContext,
  GameEvent,
  getEventKey,
  readEventKey,
  dispatchEvent,
  getEvents,
} from './Events';

const PLUGIN_NAMESPACE = 'core.scheduler';

export type ScheduledEvent = {
  id?: string;
  duration: number;
  event: GameEvent;
};

type SchedulerState = {
  scheduled: ScheduledEvent[];
};

export type SchedulerContext = {
  schedule: Transformer<[ScheduledEvent], GameContext>;
  cancel: Transformer<[string], GameContext>;
};

export const schedulerPipe: Pipe = ({ state, context }) => {
  const deltaTime = context.deltaTime;
  const stateComposer = new Composer(state);

  const { scheduled = [] } =
    stateComposer.from<SchedulerState>(PLUGIN_NAMESPACE);

  const { events } = getEvents(context, getEventKey(PLUGIN_NAMESPACE, '*'), {
    consume: true,
  });

  const updatedSchedule = [...scheduled];
  const toDispatch: GameEvent[] = [];

  for (const event of events) {
    const key = readEventKey(event.type).key;

    if (key === 'schedule') {
      updatedSchedule.push(event.payload);
    }

    if (key === 'cancel') {
      const id = event.payload;
      const idx = updatedSchedule.findIndex(s => s.id === id);
      if (idx !== -1) updatedSchedule.splice(idx, 1);
    }
  }

  const remaining: ScheduledEvent[] = [];

  for (const entry of updatedSchedule) {
    const time = entry.duration - deltaTime;
    if (time <= 0) {
      toDispatch.push(entry.event);
    } else {
      remaining.push({ ...entry, duration: time });
    }
  }

  stateComposer.setIn(PLUGIN_NAMESPACE, { scheduled: remaining });

  const contextComposer = new Composer(context);
  for (const a of toDispatch) contextComposer.apply(dispatchEvent, a);

  contextComposer.setIn(PLUGIN_NAMESPACE, {
    schedule: (event: ScheduledEvent) =>
      Composer.build<GameContext>(ctx =>
        ctx.apply(ctx.from<EventContext>('core.events').dispatch, {
          type: getEventKey(PLUGIN_NAMESPACE, 'schedule'),
          payload: event,
        })
      ),
    cancel: (id: string) =>
      Composer.build<GameContext>(ctx =>
        ctx.apply(ctx.from<EventContext>('core.events').dispatch, {
          type: getEventKey(PLUGIN_NAMESPACE, 'cancel'),
          payload: id,
        })
      ),
  });

  return {
    state: stateComposer.get(),
    context: contextComposer.get(),
  };
};
