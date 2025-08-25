import { Pipe, PipeTransformer } from '../State';
import { Composer } from '../Composer';
import { getEventKey, GameEvent, Events } from './Events';
import { getScheduleKey, Scheduler } from './Scheduler';

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

      Composer.chain(c => {
        const { messages = [] } = c.get<MessageState>([
          'state',
          PLUGIN_NAMESPACE,
        ]);
        const messageId = (event.payload as GameMessage).id;
        const updated = messages.find(m => m.id === messageId);
        const scheduleId = getScheduleKey(
          PLUGIN_NAMESPACE,
          `message/${messageId}`
        );

        if (updated?.duration !== undefined) {
          const eventType = getEventKey(PLUGIN_NAMESPACE, 'expireMessage');
          return c.pipe(
            Scheduler.schedule({
              id: scheduleId,
              duration: updated.duration,
              event: {
                type: eventType,
                payload: updated.id,
              },
            })
          );
        } else {
          return c.pipe(Scheduler.cancel(scheduleId));
        }
      })
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
