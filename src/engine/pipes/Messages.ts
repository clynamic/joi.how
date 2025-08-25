import { Pipe, PipeTransformer } from '../State';
import { Composer } from '../Composer';
import { getEventKey, GameEvent, Events } from './Events';
import { Scheduler } from './Scheduler';

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
};

export class Messages {
  static send(message: PartialGameMessage): Pipe {
    return Composer.bind<MessageContext>(
      ['context', PLUGIN_NAMESPACE],
      ({ sendMessage }) => sendMessage(message)
    );
  }
}

export const messagesPipe: Pipe = Composer.pipe(
  Composer.set<MessageContext>(['context', PLUGIN_NAMESPACE], {
    sendMessage: msg =>
      Events.dispatch({
        type: getEventKey(PLUGIN_NAMESPACE, 'sendMessage'),
        payload: msg,
      }),
  }),

  Events.handle(getEventKey(PLUGIN_NAMESPACE, 'sendMessage'), event =>
    Composer.pipe(
      Composer.over<MessageState>(
        ['state', PLUGIN_NAMESPACE],
        ({ messages = [] }) => {
          const patch = event.payload as GameMessage;
          const index = messages.findIndex(m => m.id === patch.id);
          const existing = messages[index];

          if (!existing && !patch.title) return { messages };

          const updated = [...messages];
          updated[index < 0 ? updated.length : index] = {
            ...existing,
            ...patch,
          };

          return { messages: updated };
        }
      ),

      Composer.bind<MessageState>(
        ['state', PLUGIN_NAMESPACE],
        ({ messages = [] }) => {
          const messageId = (event.payload as GameMessage).id;
          const updated = messages.find(m => m.id === messageId);
          const scheduleId = `${PLUGIN_NAMESPACE}.message.${messageId}`;
          return updated?.duration !== undefined
            ? Scheduler.schedule({
                id: scheduleId,
                duration: updated!.duration!,
                event: {
                  type: getEventKey(PLUGIN_NAMESPACE, 'expireMessage'),
                  payload: updated.id,
                },
              })
            : Scheduler.cancel(scheduleId);
        }
      )
    )
  ),

  Events.handle(getEventKey(PLUGIN_NAMESPACE, 'expireMessage'), event =>
    Composer.over<MessageState>(
      ['state', PLUGIN_NAMESPACE],
      ({ messages = [] }) => ({
        messages: messages.filter(m => m.id !== event.payload),
      })
    )
  )
);
