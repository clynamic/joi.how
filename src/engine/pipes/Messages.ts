import { GameContext, Pipe } from '../State';
import { Composer, Transformer } from '../Composer';
import { ActionContext, assembleActionKey, GameAction } from './Action';

export interface GameMessagePrompt {
  title: string;
  action: GameAction;
}

export interface GameMessage {
  id: string;
  title: string;
  description?: string;
  prompts?: GameMessagePrompt[];
  duration?: number;
}

export type PartialGameMessage = Partial<GameMessage> & Pick<GameMessage, 'id'>;

const PLUGIN_NAMESPACE = 'core.messages';

export type MessageContext = {
  sendMessage: Transformer<[PartialGameMessage], GameContext>;
};

export type MessageState = {
  messages: GameMessage[];
  timers: Record<string, number>;
};

export const messagesPipe: Pipe = ({ state, context }) => {
  const deltaTime = context.deltaTime;

  const stateComposer = new Composer(state);
  const contextComposer = new Composer(context);

  const { messages = [], timers = {} } =
    stateComposer.from<MessageState>(PLUGIN_NAMESPACE);

  const { handle } = contextComposer.from<ActionContext>('core.actions');

  const { actions } = handle(context, `${PLUGIN_NAMESPACE}/sendMessage`, {
    consume: true,
  });

  const updated: GameMessage[] = [];
  const updatedTimers: Record<string, number> = {};

  for (const message of messages) {
    const remaining = timers[message.id];
    if (remaining != null) {
      const next = remaining - deltaTime;
      if (next > 0) {
        updated.push(message);
        updatedTimers[message.id] = next;
      }
    } else {
      updated.push(message);
    }
  }

  for (const action of actions) {
    const patch = action.payload as GameMessage;
    const existing = updated.find(m => m.id === patch.id);
    if (!existing && !patch.title) continue;

    const base = existing ?? { id: patch.id, title: patch.title! };
    const merged: GameMessage = { ...base, ...patch };

    const index = updated.findIndex(m => m.id === patch.id);
    if (index >= 0) updated[index] = merged;
    else updated.push(merged);

    if (patch.duration !== undefined) {
      updatedTimers[patch.id] = patch.duration;
    }
  }

  stateComposer.setIn(PLUGIN_NAMESPACE, {
    messages: updated,
    timers: updatedTimers,
  });

  contextComposer.setIn(PLUGIN_NAMESPACE, {
    sendMessage: (msg: GameMessage) =>
      Composer.build<GameContext>(ctx =>
        ctx.apply(ctx.from<ActionContext>('core.actions').dispatch, {
          type: assembleActionKey(PLUGIN_NAMESPACE, 'sendMessage'),
          payload: msg,
        })
      ),
  });

  return {
    state: stateComposer.get(),
    context: contextComposer.get(),
  };
};
