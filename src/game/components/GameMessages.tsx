import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { GameMessage, GameMessagePrompt, useGameValue } from '../GameProvider';
import { defaultTransition, playTone } from '../../utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslate } from '../../settings';

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
  const [, setTimers] = useState<Record<string, number>>({});
  const [currentMessages, setCurrentMessages] = useState<GameMessage[]>([]);
  const [previousMessages, setPreviousMessages] = useState<GameMessage[]>([]);
  const [messages, setMessages] = useGameValue('messages');
  const translate = useTranslate();

  useEffect(() => {
    setPreviousMessages(currentMessages);
    setCurrentMessages(messages);
  }, [currentMessages, messages]);

  useEffect(() => {
    const addedMessages = currentMessages.filter(
      message => !previousMessages.includes(message)
    );

    const newTimers = addedMessages.reduce(
      (acc, message) => {
        if (message.duration) {
          acc[message.id] = window.setTimeout(
            () => setMessages(messages => messages.filter(m => m !== message)),
            message.duration
          );
        }
        return acc;
      },
      {} as Record<string, number>
    );

    if (addedMessages.length > 0) {
      playTone(200);
    }

    const removedMessages = previousMessages.filter(
      message => !currentMessages.includes(message)
    );
    const removedTimers = removedMessages.map(message => message.id);

    setTimers(timers => ({
      ...Object.keys(timers).reduce((acc, key) => {
        if (removedTimers.includes(key)) {
          window.clearTimeout(timers[key]);
          return acc;
        }
        return { ...acc, [key]: timers[key] };
      }, {}),
      ...newTimers,
    }));
  }, [currentMessages, previousMessages, setMessages]);

  const onMessageClick = useCallback(
    async (message: GameMessage, prompt: GameMessagePrompt) => {
      await prompt.onClick();
      setMessages(messages => messages.filter(m => m !== message));
    },
    [setMessages]
  );

  return (
    <StyledGameMessages>
      <AnimatePresence>
        {currentMessages.map(message => (
          <StyledGameMessage key={message.id}>
            <StyledGameMessageTitle
              key={message.title}
              initial={{
                y: '-100%',
                opacity: 0,
              }}
              animate={{
                y: '0%',
                opacity: 1,
              }}
              exit={{
                y: '-100%',
                opacity: 0,
              }}
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
                onClick={() => onMessageClick(message, prompt)}
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
