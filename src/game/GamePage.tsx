import styled from 'styled-components';
import { GameEngineProvider } from './GameProvider';
import { FpsDisplay } from './components/FpsDisplay';
import { useCallback } from 'react';
import { PipeValue } from '../engine';
import {
  MessageContext,
  messagesPipe,
  PartialGameMessage,
} from '../engine/pipes/Messages';
import { GameMessages } from './components/GameMessages';
import { PauseButton } from './components/Pause';
import {
  assembleActionKey,
  disassembleActionKey,
  getActions,
} from '../engine/pipes/Action';
import { fpsPipe } from '../engine/pipes/Fps';
import { SchedulerContext } from '../engine/pipes/Scheduler';
import { Composer } from '../engine/Composer';

const StyledGamePage = styled.div`
  position: relative;

  height: 100%;
  width: 100%;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const StyledTopBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;

  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;

  & > *:first-child {
    margin-bottom: 8px;
  }

  & > *:nth-child(2) {
    margin-left: auto;
  }
`;

const StyledCenter = styled.div`
  position: relative;

  & > *:nth-child(2) {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    white-space: nowrap;
  }
`;

const StyledBottomBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;

  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;

  align-items: flex-end;

  & > *:nth-child(2) {
    margin-left: auto;
  }
`;

export const GamePage = () => {
  const messageTestPipe = useCallback(({ context, state }: PipeValue) => {
    const MSG_TEST_NAMESPACE = 'core.message_test';
    const messageId = 'test-message';

    const composer = new Composer(context);
    const { sent } = composer.from<{ sent: boolean }>(MSG_TEST_NAMESPACE);

    const send = (msg: PartialGameMessage) =>
      composer.apply(
        composer.from<{ sendMessage: MessageContext['sendMessage'] }>(
          'core.messages'
        ).sendMessage,
        msg
      );

    if (!sent) {
      send({
        id: messageId,
        title: 'Test Message',
        description:
          'This is a test message to demonstrate the message system.',
        prompts: [
          {
            title: 'Acknowledge',
            action: {
              type: assembleActionKey(MSG_TEST_NAMESPACE, 'acknowledgeMessage'),
            },
          },
          {
            title: 'Dismiss',
            action: {
              type: assembleActionKey(MSG_TEST_NAMESPACE, 'dismissMessage'),
            },
          },
        ],
      });
    }

    const { actions } = getActions(
      composer.get(),
      assembleActionKey(MSG_TEST_NAMESPACE, '*')
    );

    for (const action of actions) {
      const key = disassembleActionKey(action.type).key;

      if (key === 'acknowledgeMessage') {
        const schedule =
          composer.from<SchedulerContext>('core.scheduler').schedule;

        composer.apply(schedule, {
          duration: 2000,
          action: {
            type: assembleActionKey(MSG_TEST_NAMESPACE, 'followupMessage'),
          },
        });

        send({
          id: messageId,
          duration: 0,
        });
      }

      if (key === 'dismissMessage') {
        send({
          id: messageId,
          duration: 0,
        });
      }

      if (key === 'followupMessage') {
        send({
          id: 'followup-message',
          title: 'Follow-up Message',
          description:
            'This is a follow-up message after acknowledging the test message.',
          prompts: [
            {
              title: 'Close',
              action: {
                type: assembleActionKey(MSG_TEST_NAMESPACE, 'dismissMessage'),
                payload: { id: 'followup-message' },
              },
            },
          ],
        });
      }
    }

    console.log(composer.get());

    return {
      state: new Composer(state)
        .setIn(MSG_TEST_NAMESPACE, { sent: true })
        .get(),
      context: composer.get(),
    };
  }, []);

  return (
    <GameEngineProvider pipes={[fpsPipe, messagesPipe, messageTestPipe]}>
      <StyledGamePage>
        <StyledTopBar>
          <FpsDisplay />
          <GameMessages />
        </StyledTopBar>
        <StyledCenter></StyledCenter>
        <StyledBottomBar>
          <PauseButton />
        </StyledBottomBar>
      </StyledGamePage>
    </GameEngineProvider>
  );
};
