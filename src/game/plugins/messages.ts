import type { Plugin } from '../../engine/plugins/Plugins';
import { pluginPaths } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { Composer } from '../../engine/Composer';
import { Events, GameEvent } from '../../engine/pipes/Events';
import { Scheduler } from '../../engine/pipes/Scheduler';

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

export type MessageState = {
  messages: GameMessage[];
};

const PLUGIN_ID = 'core.messages';

const paths = pluginPaths<MessageState>(PLUGIN_ID);

const eventType = Events.getKeys(PLUGIN_ID, 'send_message', 'expire_message');

export default class Messages {
  static send(message: PartialGameMessage): Pipe {
    return Events.dispatch({
      type: eventType.sendMessage,
      payload: message,
    });
  }

  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Messages',
    },

    activate: Composer.set(paths.state, { messages: [] }),

    update: Composer.pipe(
      Events.handle<PartialGameMessage>(eventType.sendMessage, event =>
        Composer.pipe(
          Composer.over(paths.state, ({ messages }) => {
            const patch = event.payload;
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
            const { messages } = get(paths.state);
            const messageId = event.payload.id;
            const updated = messages.find(m => m.id === messageId);
            const scheduleId = Scheduler.getKey(
              PLUGIN_ID,
              `message/${messageId}`
            );

            if (updated?.duration !== undefined) {
              return pipe(
                Scheduler.schedule({
                  id: scheduleId,
                  duration: updated.duration,
                  event: {
                    type: eventType.expireMessage,
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

      Events.handle<string>(eventType.expireMessage, event =>
        Composer.over(paths.state, ({ messages }) => ({
          messages: messages.filter(m => m.id !== event.payload),
        }))
      )
    ),

    deactivate: Composer.set(paths.state, undefined),
  };

  static get paths() {
    return paths;
  }
}
