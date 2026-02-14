import type { Plugin } from '../../engine/plugins/Plugins';
import { pluginPaths } from '../../engine/plugins/Plugins';
import { Pipe, PipeTransformer } from '../../engine/State';
import { Composer } from '../../engine/Composer';
import { Events, GameEvent, getEventKey } from '../../engine/pipes/Events';
import { getScheduleKey, Scheduler } from '../../engine/pipes/Scheduler';

declare module '../../engine/sdk' {
  interface PluginSDK {
    Messages: typeof Messages;
  }
}

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

export type MessageContext = {
  sendMessage: PipeTransformer<[PartialGameMessage]>;
};

export type MessageState = {
  messages: GameMessage[];
};

const PLUGIN_ID = 'core.messages';

const paths = pluginPaths<MessageState, MessageContext>(PLUGIN_ID);

const eventType = {
  send: getEventKey(PLUGIN_ID, 'sendMessage'),
  expire: getEventKey(PLUGIN_ID, 'expireMessage'),
};

export default class Messages {
  static send(message: PartialGameMessage): Pipe {
    return Composer.bind<MessageContext>(paths.context, ({ sendMessage }) =>
      sendMessage(message)
    );
  }

  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Messages',
    },

    activate: Composer.do(({ set }) => {
      set(paths.state, { messages: [] });
      set(paths.context, {
        sendMessage: msg =>
          Events.dispatch({
            type: eventType.send,
            payload: msg,
          }),
      });
    }),

    update: Composer.pipe(
      Events.handle(eventType.send, event =>
        Composer.pipe(
          Composer.over(paths.state, ({ messages = [] }) => {
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
          }),

          Composer.do(({ get, pipe }) => {
            const { messages = [] } = get(paths.state);
            const messageId = (event.payload as GameMessage).id;
            const updated = messages.find(m => m.id === messageId);
            const scheduleId = getScheduleKey(
              PLUGIN_ID,
              `message/${messageId}`
            );

            if (updated?.duration !== undefined) {
              return pipe(
                Scheduler.schedule({
                  id: scheduleId,
                  duration: updated.duration,
                  event: {
                    type: eventType.expire,
                    payload: updated.id,
                  },
                })
              );
            } else {
              return pipe(Scheduler.cancel(scheduleId));
            }
          })
        )
      ),

      Events.handle(eventType.expire, event =>
        Composer.over(paths.state, ({ messages = [] }) => ({
          messages: messages.filter(m => m.id !== event.payload),
        }))
      )
    ),

    deactivate: Composer.pipe(
      Composer.set(paths.state, undefined),
      Composer.set(paths.context, undefined)
    ),
  };
}
