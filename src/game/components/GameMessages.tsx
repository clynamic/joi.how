import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { GameMessage, GameMessagePrompt, useGameValue } from '../GameProvider';
import { playTone } from '../../utils';
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
  background: var(--overlay-color);
  color: #fff;

  font-size: 1rem;
  padding: 20px;
`);

const StyledGameMessageDescription = motion(styled.p`
  background: var(--overlay-color);
  color: #fff;

  font-size: 1rem;
  padding: 20px;

  margin: unset;
  margin-left: 1px;
`);

const StyledGameMessageButton = motion(styled.button`
  background: var(--focus-color);
  color: #fff;

  font-size: 1rem;
  padding: 20px;
  cursor: pointer;

  transition: filter 0.2s;

  margin-left: 1px;

  &:hover {
    filter: brightness(1.2);
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
              transition={{
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1],
                type: 'spring',
              }}
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
                  duration: 0.4,
                  ease: 'circInOut',
                  type: 'spring',
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
                  duration: 0.4,
                  ease: 'circInOut',
                  type: 'spring',
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
