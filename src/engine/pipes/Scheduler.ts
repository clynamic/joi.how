import { Composer, Transformer } from '../Composer';
import { GameContext, Pipe } from '../State';
import {
  ActionContext,
  GameAction,
  assembleActionKey,
  disassembleActionKey,
  dispatchAction,
  getActions,
} from './Action';

const PLUGIN_NAMESPACE = 'core.scheduler';

export type ScheduledAction = {
  id?: string;
  duration: number;
  action: GameAction;
};

type SchedulerState = {
  scheduled: ScheduledAction[];
};

export type SchedulerContext = {
  schedule: Transformer<[ScheduledAction], GameContext>;
  cancel: Transformer<[string], GameContext>;
};

export const schedulerPipe: Pipe = ({ state, context }) => {
  const deltaTime = context.deltaTime;
  const stateComposer = new Composer(state);

  const { scheduled = [] } =
    stateComposer.from<SchedulerState>(PLUGIN_NAMESPACE);

  const { actions } = getActions(
    context,
    assembleActionKey(PLUGIN_NAMESPACE, '*'),
    { consume: true }
  );

  const updatedSchedule = [...scheduled];
  const toDispatch: GameAction[] = [];

  for (const action of actions) {
    const key = disassembleActionKey(action.type).key;

    if (key === 'schedule') {
      updatedSchedule.push(action.payload);
    }

    if (key === 'cancel') {
      const id = action.payload;
      const idx = updatedSchedule.findIndex(s => s.id === id);
      if (idx !== -1) updatedSchedule.splice(idx, 1);
    }
  }

  const remaining: ScheduledAction[] = [];

  for (const entry of updatedSchedule) {
    const time = entry.duration - deltaTime;
    if (time <= 0) {
      toDispatch.push(entry.action);
    } else {
      remaining.push({ ...entry, duration: time });
    }
  }

  stateComposer.setIn(PLUGIN_NAMESPACE, { scheduled: remaining });

  const contextComposer = new Composer(context);
  for (const a of toDispatch) contextComposer.apply(dispatchAction, a);

  contextComposer.setIn(PLUGIN_NAMESPACE, {
    schedule: (action: ScheduledAction) =>
      Composer.build<GameContext>(ctx =>
        ctx.apply(ctx.from<ActionContext>('core.actions').dispatch, {
          type: assembleActionKey(PLUGIN_NAMESPACE, 'schedule'),
          payload: action,
        })
      ),
    cancel: (id: string) =>
      Composer.build<GameContext>(ctx =>
        ctx.apply(ctx.from<ActionContext>('core.actions').dispatch, {
          type: assembleActionKey(PLUGIN_NAMESPACE, 'cancel'),
          payload: id,
        })
      ),
  });

  return {
    state: stateComposer.get(),
    context: contextComposer.get(),
  };
};
