import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { Composer } from '../../engine/Composer';
import { Events, GameEvent } from '../../engine/pipes/Events';
import { ScheduledEvent, Scheduler } from '../../engine/pipes/Scheduler';
import { PLAY_TIMELINE } from '../timelines';
import Saves from './saves';

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
  versions: Record<string, number>;
};

type ExpirePayload = { id: string; version: number };

const PLUGIN_ID = 'core.messages';

const paths = pluginPaths<MessageState>(PLUGIN_ID);

const eventType = Events.getKeys(PLUGIN_ID, 'send_message', 'expire_message');

const Messages = definePlugin({
  sdk: 'Messages',
  id: PLUGIN_ID,
  meta: {
    name: 'Messages',
  },

  send(message: PartialGameMessage): Pipe {
    return Events.dispatch({
      type: eventType.sendMessage,
      payload: message,
    });
  },

  activate: Composer.set(paths, { messages: [], versions: {} }),

  update: Composer.pipe(
    Saves.onSave(PLUGIN_ID, get => ({
      state: get(paths),
      timers: Scheduler.snapshot(get(), PLUGIN_ID),
    })),
    Saves.onLoad<{ state: MessageState; timers: ScheduledEvent[] }>(
      PLUGIN_ID,
      data =>
        Composer.pipe(
          Composer.set(paths, data?.state ?? { messages: [], versions: {} }),
          Scheduler.restore(PLUGIN_ID, data?.timers ?? [])
        )
    ),
    Events.handle<PartialGameMessage>(eventType.sendMessage, event =>
      Composer.pipe(
        Composer.over(paths, ({ messages, versions = {} }) => {
          const patch = event.payload;
          const index = messages.findIndex(m => m.id === patch.id);
          const existing = messages[index];

          if (!existing && !patch.title) return { messages, versions };

          const updated = [...messages];
          updated[index < 0 ? updated.length : index] = {
            ...existing,
            ...patch,
            duration: patch.duration,
          };

          return {
            messages: updated,
            versions: {
              ...versions,
              [patch.id]: (versions[patch.id] ?? 0) + 1,
            },
          };
        }),

        Composer.do(({ get, pipe }) => {
          const { messages, versions } = get(paths);
          const messageId = event.payload.id;
          const updated = messages.find(m => m.id === messageId);
          const version = versions[messageId] ?? 0;
          const scheduleId = Scheduler.getKey(
            PLUGIN_ID,
            `message/${messageId}`
          );

          if (updated?.duration !== undefined) {
            return pipe(
              Scheduler.schedule({
                id: scheduleId,
                duration: updated.duration,
                timeline: PLAY_TIMELINE,
                event: {
                  type: eventType.expireMessage,
                  payload: { id: updated.id, version },
                },
              })
            );
          } else {
            return pipe(Scheduler.cancel(scheduleId));
          }
        })
      )
    ),

    Events.handle<ExpirePayload>(eventType.expireMessage, event =>
      Composer.over(paths, state => {
        const { id, version } = event.payload;
        if ((state.versions ?? {})[id] !== version) return state;
        return { ...state, messages: state.messages.filter(m => m.id !== id) };
      })
    )
  ),

  deactivate: Composer.set(paths, undefined),

  get paths() {
    return paths;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Messages: typeof Messages;
  }
}

export default Messages;
