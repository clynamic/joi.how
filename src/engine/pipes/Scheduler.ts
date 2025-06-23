import { Composer, Transformer } from '../Composer';
import { GameContext, GameState, Pipe } from '../State';
import { GameAction, dispatchAction } from './Action';

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

  const stateComposer = new Composer<GameState>(state);
  const contextComposer = new Composer<GameContext>(context);

  const scheduled =
    stateComposer.from<SchedulerState>(PLUGIN_NAMESPACE).scheduled ?? [];

  const remaining: ScheduledAction[] = [];
  const actionsToDispatch: GameAction[] = [];

  for (const entry of scheduled) {
    const nextTime = entry.duration - deltaTime;
    if (nextTime <= 0) {
      actionsToDispatch.push(entry.action);
    } else {
      remaining.push({ ...entry, duration: nextTime });
    }
  }

  stateComposer.setIn(PLUGIN_NAMESPACE, { scheduled: remaining });

  for (const action of actionsToDispatch) {
    contextComposer.apply(dispatchAction, action);
  }

  contextComposer.setIn(PLUGIN_NAMESPACE, {
    schedule: (action: ScheduledAction) =>
      Composer.build<GameContext>(c =>
        c.setIn(PLUGIN_NAMESPACE, {
          scheduled: [
            ...(c.from<SchedulerState>(PLUGIN_NAMESPACE).scheduled ?? []),
            action,
          ],
        })
      ),
    cancel: (id: string) =>
      Composer.build<GameContext>(c =>
        c.setIn(PLUGIN_NAMESPACE, {
          scheduled: (
            c.from<SchedulerState>(PLUGIN_NAMESPACE).scheduled ?? []
          ).filter(s => s.id !== id),
        })
      ),
  });

  return {
    state: stateComposer.get(),
    context: contextComposer.get(),
  };
};
