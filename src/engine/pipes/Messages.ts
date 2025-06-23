import { GameContext, PipeValue } from '../State';
import { fromNamespace, namespaced } from '../Namespace';
import { GameAction } from './Action';

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

const PLUGIN_NAMESPACE = 'core.messages';

export type MessageContext = {
  pendingMessages?: (Partial<GameMessage> & Pick<GameMessage, 'id'>)[];
  sendMessage: (
    msg: Partial<GameMessage> & Pick<GameMessage, 'id'>
  ) => GameContext;
};

export type MessageState = {
  messages: GameMessage[];
  timers: Record<string, number>;
};

export const messagesPipe = ({ state, context }: PipeValue): PipeValue => {
  const deltaTime = context.deltaTime;

  const { pendingMessages = [] } = fromNamespace<MessageContext>(
    context,
    PLUGIN_NAMESPACE
  );

  const { messages = [], timers = {} } = fromNamespace<MessageState>(
    state,
    PLUGIN_NAMESPACE
  );

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

  for (const patch of pendingMessages) {
    const existing = updated.find(m => m.id === patch.id);

    if (!existing) {
      if (!patch.title) continue;
    }

    const base = existing ?? { id: patch.id, title: patch.title! };

    const merged: GameMessage = {
      ...base,
      ...patch,
    };

    const index = updated.findIndex(m => m.id === patch.id);
    if (index >= 0) updated[index] = merged;
    else updated.push(merged);

    if (patch.duration !== undefined) {
      updatedTimers[patch.id] = patch.duration;
    }
  }

  const newState = namespaced(PLUGIN_NAMESPACE, {
    messages: updated,
    timers: updatedTimers,
  })(state);

  const newContext = namespaced(PLUGIN_NAMESPACE, {
    pendingMessages: [],
    sendMessage: (msg: Partial<GameMessage> & { id: string }): GameContext => {
      const queue =
        fromNamespace<MessageContext>(newContext, PLUGIN_NAMESPACE)
          .pendingMessages ?? [];
      return namespaced(PLUGIN_NAMESPACE, {
        pendingMessages: [...queue, msg],
      })(newContext);
    },
  })(context);

  return {
    state: newState,
    context: newContext,
  };
};
