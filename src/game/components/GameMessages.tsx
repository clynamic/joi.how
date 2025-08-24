import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import { useTranslate } from '../../settings';

import { defaultTransition, playTone } from '../../utils';
import { GameMessage, MessageState } from '../../engine/pipes/Messages';
import { useGameState } from '../hooks/UseGameValue';

import _ from 'lodash';
import { useDispatchEvent } from '../hooks/UseDispatchEvent';

const StyledGameMessages = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const StyledGameMessage = motion(styled.div`
  display: flex;
`);

const StyledGameMessageTitle = motion(styled.div`
  background: var(--overlay-background);
  color: var(--overlay-color);

  font-size: 1rem;
  padding: 20px;
`);

const StyledGameMessageDescription = motion(styled.p`
  background: var(--overlay-background);
  color: var(--overlay-color);

  font-size: 1rem;
  padding: 20px;

  margin: unset;
  margin-left: 1px;
`);

const StyledGameMessageButton = motion(styled.button`
  background: var(--button-background);
  color: var(--button-color);

  height: 100%;

  font-size: 1rem;
  padding: 20px;
  cursor: pointer;

  transition: var(--hover-transition);

  margin-left: 1px;

  &:hover {
    filter: var(--hover-filter);
  }
`);

export const GameMessages = () => {
  const { messages } = useGameState<MessageState>('core.messages');
  const { dispatchEvent } = useDispatchEvent();
  const translate = useTranslate();

  const prevMessagesRef = useRef<GameMessage[]>([]);

  useEffect(() => {
    const prevMessages = prevMessagesRef.current;

    const changed = messages?.some(newMsg => {
      const oldMsg = prevMessages.find(prev => prev.id === newMsg.id);
      return !oldMsg || !_.isEqual(oldMsg, newMsg);
    });

    if (changed) {
      playTone(200);
    }

    prevMessagesRef.current = messages ?? [];
  }, [messages]);

  return (
    <StyledGameMessages>
      <AnimatePresence>
        {messages?.map(message => (
          <StyledGameMessage key={message.id}>
            <StyledGameMessageTitle
              key={message.title}
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={defaultTransition}
            >
              {translate(message.title)}
            </StyledGameMessageTitle>
            {message.description && (
              <StyledGameMessageDescription
                key={message.description}
                initial={{ y: '-100%' }}
                animate={{ y: 0 }}
                exit={{ y: '-100%' }}
                transition={{
                  ...defaultTransition,
                  ease: 'circInOut',
                }}
              >
                {message.description}
              </StyledGameMessageDescription>
            )}
            {message.prompts?.map(prompt => (
              <StyledGameMessageButton
                key={prompt.title}
                initial={{ y: '-100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{
                  ...defaultTransition,
                  ease: 'circInOut',
                }}
                onClick={() => dispatchEvent(prompt.event)}
              >
                {translate(prompt.title)}
              </StyledGameMessageButton>
            ))}
          </StyledGameMessage>
        ))}
      </AnimatePresence>
    </StyledGameMessages>
  );
};
