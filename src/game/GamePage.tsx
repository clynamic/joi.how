import styled from 'styled-components';
import { GameEngineProvider } from './GameProvider';
import { FpsDisplay } from './components/FpsDisplay';
import { useCallback } from 'react';
import { PipeValue } from '../engine';
import { fromNamespace, namespaced } from '../engine/Namespace';
import { MessageContext, messagesPipe } from '../engine/pipes/Messages';
import { GameMessages } from './components/GameMessages';
import { PauseButton } from './components/Pause';
import { assembleActionKey, getActions } from '../engine/pipes/Action';
import { fpsPipe } from '../engine/pipes/Fps';

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
    const { sent } = fromNamespace<{ sent?: boolean }>(
      state,
      MSG_TEST_NAMESPACE
    );
    const { sendMessage } = fromNamespace<MessageContext>(
      context,
      'core.messages'
    );

    let newContext = context;

    const messageId = 'test-message';

    if (!sent) {
      newContext = sendMessage({
        id: messageId,
        title: 'Test Message',
        description:
          'This is a test message to demonstrate the message system.',
        prompts: [
          {
            title: 'Acknowledge',
            action: {
              type: assembleActionKey(MSG_TEST_NAMESPACE, 'acknowledgeMessage'),
              payload: { id: messageId },
            },
          },
          {
            title: 'Dismiss',
            action: {
              type: assembleActionKey(MSG_TEST_NAMESPACE, 'dismissMessage'),
              payload: { id: messageId },
            },
          },
        ],
      });
    }

    const { actions } = getActions(
      newContext,
      assembleActionKey(MSG_TEST_NAMESPACE, '*')
    );

    for (const _ of actions) {
      newContext = sendMessage({
        id: messageId,
        duration: 0,
      });
    }

    return {
      state: namespaced(MSG_TEST_NAMESPACE, { sent: true })(state),
      context: newContext,
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
