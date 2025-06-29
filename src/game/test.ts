import { Pipe } from '../engine';
import { Composer } from '../engine/Composer';
import { EventContext, getEventKey } from '../engine/pipes/Events';
import { MessageContext } from '../engine/pipes/Messages';
import { SchedulerContext } from '../engine/pipes/Scheduler';

const MSG_TEST_NAMESPACE = 'core.message_test';
const messageId = 'test-message';
const followupId = 'followup-message';

export const messageTestPipe: Pipe = Composer.chain(c => {
  const { sendMessage } = c.get<MessageContext>([
    'context',
    'core',
    'messages',
  ]);
  const { handle } = c.get<EventContext>(['context', 'core', 'events']);
  const { schedule } = c.get<SchedulerContext>([
    'context',
    'core',
    'scheduler',
  ]);

  return c
    .bind<{ sent: boolean }>(
      ['state', MSG_TEST_NAMESPACE],
      ({ sent = false }) =>
        Composer.unless(sent, c =>
          c
            .pipe(
              sendMessage({
                id: messageId,
                title: 'Test Message',
                prompts: [
                  {
                    title: 'Acknowledge',
                    event: {
                      type: getEventKey(
                        MSG_TEST_NAMESPACE,
                        'acknowledgeMessage'
                      ),
                    },
                  },
                  {
                    title: 'Dismiss',
                    event: {
                      type: getEventKey(MSG_TEST_NAMESPACE, 'dismissMessage'),
                    },
                  },
                ],
              })
            )

            .set(['state', MSG_TEST_NAMESPACE, 'sent'], true)
        )
    )

    .pipe(
      handle(getEventKey(MSG_TEST_NAMESPACE, 'acknowledgeMessage'), () =>
        Composer.pipe(
          schedule({
            duration: 2000,
            event: {
              type: getEventKey(MSG_TEST_NAMESPACE, 'followupMessage'),
            },
          }),
          sendMessage({
            id: messageId,
            duration: 0,
          })
        )
      )
    )

    .pipe(
      handle(getEventKey(MSG_TEST_NAMESPACE, 'dismissMessage'), () =>
        Composer.pipe(
          sendMessage({ id: messageId, duration: 0 }),
          sendMessage({ id: followupId, duration: 0 })
        )
      )
    )

    .pipe(
      handle(getEventKey(MSG_TEST_NAMESPACE, 'followupMessage'), () =>
        Composer.pipe(
          sendMessage({
            id: followupId,
            title: 'Follow-up Message',
            description: 'Ready',
            prompts: [
              {
                title: 'Close',
                event: {
                  type: getEventKey(MSG_TEST_NAMESPACE, 'dismissMessage'),
                  payload: { id: followupId },
                },
              },
            ],
          })
        )
      )
    );
});
