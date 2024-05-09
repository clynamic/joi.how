import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSetting } from '../../settings';
import { createSendMessage, GamePhase, useGameValue } from '../GameProvider';

export const GameWarmup = () => {
  const [warmup] = useSetting('warmupDuration');
  const [phase, setPhase] = useGameValue('phase');
  const [, setTimer] = useState<number | null>(null);
  const [, setMessages] = useGameValue('messages');
  const sendMessage = useMemo(
    () => createSendMessage(setMessages),
    [setMessages]
  );

  const onStart = useCallback(() => {
    setPhase(GamePhase.active);
    setTimer(timer => {
      if (timer) window.clearTimeout(timer);
      return null;
    });
    sendMessage({
      id: GamePhase.warmup,
      title: 'Now follow what I say $player!',
      duration: 5000,
      prompts: undefined,
    });
  }, [sendMessage, setPhase]);

  useEffect(() => {
    if (phase !== GamePhase.warmup) return;
    if (warmup === 0) {
      setPhase(GamePhase.active);
      return;
    }
    setTimer(window.setTimeout(onStart, warmup * 1000));

    sendMessage({
      id: GamePhase.warmup,
      title: 'Get yourself ready!',
      prompts: [
        {
          title: `I'm ready, $master`,
          onClick: onStart,
        },
      ],
    });

    return () => {
      setTimer(timer => {
        if (timer) window.clearTimeout(timer);
        return null;
      });
    };
  }, [onStart, phase, sendMessage, setPhase, warmup]);

  return null;
};
