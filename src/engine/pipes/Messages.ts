import { Pipe, PipeTransformer } from '../State';
import { Composer } from '../Composer';
import { EventContext, getEventKey, GameEvent } from './Events';

export interface GameMessagePrompt {
  title: string;
  event: GameEvent;
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
  sendMessage: PipeTransformer<[PartialGameMessage]>;
};

export type MessageState = {
  messages: GameMessage[];
  timers: Record<string, number>;
};

export const messagesPipe: Pipe = Composer.build(c => {
  const { dispatch, handle } = c.get<EventContext>([
    'context',
    'core',
    'events',
  ]);

  return c
    .bind<number>(
      ['context', 'deltaTime'],
      delta => c =>
        c.over<MessageState>(
          ['state', PLUGIN_NAMESPACE],
          ({ messages = [], timers = {} }) => {
            const updated: GameMessage[] = [];
            const updatedTimers: Record<string, number> = {};

            for (const message of messages) {
              const remaining = timers[message.id];
              if (remaining != null) {
                const next = remaining - delta;
                if (next > 0) {
                  updated.push(message);
                  updatedTimers[message.id] = next;
                }
              } else {
                updated.push(message);
              }
            }

            return { messages: updated, timers: updatedTimers };
          }
        )
    )

    .set<MessageContext>(['context', PLUGIN_NAMESPACE], {
      sendMessage: (msg: PartialGameMessage) =>
        Composer.build(c =>
          c.apply(dispatch, {
            type: getEventKey(PLUGIN_NAMESPACE, 'sendMessage'),
            payload: msg,
          })
        ),
    })

    .apply(handle, getEventKey(PLUGIN_NAMESPACE, 'sendMessage'), event =>
      Composer.build(c =>
        c.over<MessageState>(
          ['state', PLUGIN_NAMESPACE],
          ({ messages = [], timers = {} }) => {
            const patch = event.payload as GameMessage;
            const existing = messages.find(m => m.id === patch.id);
            if (!existing && !patch.title) return { messages, timers };

            const base = existing ?? { id: patch.id, title: patch.title! };
            const merged: GameMessage = { ...base, ...patch };

            const newMessages = [...messages];
            const index = newMessages.findIndex(m => m.id === patch.id);
            if (index >= 0) newMessages[index] = merged;
            else newMessages.push(merged);

            const newTimers = { ...timers };
            if (patch.duration !== undefined) {
              newTimers[patch.id] = patch.duration;
            }

            return { messages: newMessages, timers: newTimers };
          }
        )
      )
    );
});
