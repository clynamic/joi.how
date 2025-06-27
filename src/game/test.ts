import { Pipe } from '../engine';
import { Composer } from '../engine/Composer';
import { EventContext, getEventKey } from '../engine/pipes/Events';
import { MessageContext } from '../engine/pipes/Messages';
import { SchedulerContext } from '../engine/pipes/Scheduler';

const MSG_TEST_NAMESPACE = 'core.message_test';
const messageId = 'test-message';
const followupId = 'followup-message';

export const messageTestPipe: Pipe = Composer.build(c => {
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
        c =>
          c.unless(sent, c =>
            c
              .apply(sendMessage, {
                id: messageId,
                title: 'Test Message',
                description:
                  'This is a test message to demonstrate the message system.',
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

              .set(['state', MSG_TEST_NAMESPACE, 'sent'], true)
          )
    )

    .apply(handle, getEventKey(MSG_TEST_NAMESPACE, 'acknowledgeMessage'), () =>
      Composer.build(c =>
        c
          .apply(schedule, {
            duration: 2000,
            event: {
              type: getEventKey(MSG_TEST_NAMESPACE, 'followupMessage'),
            },
          })
          .apply(sendMessage, {
            id: messageId,
            duration: 0,
          })
      )
    )

    .apply(handle, getEventKey(MSG_TEST_NAMESPACE, 'dismissMessage'), () =>
      Composer.build(c =>
        c
          .apply(sendMessage, { id: messageId, duration: 0 })
          .apply(sendMessage, { id: followupId, duration: 0 })
      )
    )

    .apply(handle, getEventKey(MSG_TEST_NAMESPACE, 'followupMessage'), () =>
      Composer.build(c =>
        c.apply(sendMessage, {
          id: followupId,
          title: 'Follow-up Message',
          description:
            'This is a follow-up message after acknowledging the test message.',
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
    );
});
