import { Pipe, PipeTransformer } from '../State';
import { Composer } from '../Composer';
import { EventContext, getEventKey, GameEvent } from './Events';
import { SchedulerContext } from './Scheduler';

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

export const messagesPipe: Pipe = Composer.chain(c => {
  const { dispatch, handle } = c.get<EventContext>([
    'context',
    'core',
    'events',
  ]);

  return c
    .set<MessageContext>(['context', PLUGIN_NAMESPACE], {
      sendMessage: msg =>
        Composer.pipe(
          dispatch({
            type: getEventKey(PLUGIN_NAMESPACE, 'sendMessage'),
            payload: msg,
          })
        ),
    })

    .pipe(
      handle(getEventKey(PLUGIN_NAMESPACE, 'sendMessage'), event =>
        Composer.chain(c => {
          const messageId = (event.payload as GameMessage).id;
          const { schedule, cancel } = c.get<SchedulerContext>([
            'context',
            'core.scheduler',
          ]);

          return c
            .over<MessageState>(
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
            )

            .bind<MessageState>(
              ['state', PLUGIN_NAMESPACE],
              ({ messages = [] }) =>
                Composer.chain(c => {
                  const updated = messages.find(m => m.id === messageId);
                  const scheduleId = `${PLUGIN_NAMESPACE}.message.${messageId}`;
                  return c.pipe(
                    updated?.duration !== undefined
                      ? schedule({
                          id: scheduleId,
                          duration: updated!.duration!,
                          event: {
                            type: getEventKey(
                              PLUGIN_NAMESPACE,
                              'expireMessage'
                            ),
                            payload: updated.id,
                          },
                        })
                      : cancel(scheduleId)
                  );
                })
            );
        })
      )
    )

    .pipe(
      handle(getEventKey(PLUGIN_NAMESPACE, 'expireMessage'), event =>
        Composer.over<MessageState>(
          ['state', PLUGIN_NAMESPACE],
          ({ messages = [] }) => ({
            messages: messages.filter(m => m.id !== event.payload),
          })
        )
      )
    );
});
