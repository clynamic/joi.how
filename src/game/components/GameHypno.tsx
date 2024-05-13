import styled from 'styled-components';
import { useSetting, useTranslate } from '../../settings';
import { GameHypnoType, HypnoPhrases } from '../../types';
import { useLooping } from '../../utils';
import { GamePhase, useGameValue } from '../GameProvider';
import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

const StyledGameHypno = motion(styled.div`
  pointer-events: none;
  font-size: 4rem;
  font-weight: bold;
  -webkit-text-stroke: black 1px;
`);

export const GameHypno = () => {
  const [hypno] = useSetting('hypno');
  const [current, setCurrent] = useGameValue('currentHypno');
  const [phase] = useGameValue('phase');
  const [intensity] = useGameValue('intensity');
  const translate = useTranslate();

  const phrase = useMemo(() => {
    const phrases = HypnoPhrases[hypno];
    if (!phrases || phrases.length == 0) return '';
    return translate(phrases[current % phrases.length]);
  }, [current, hypno, translate]);

  const onTick = useCallback(() => {
    setCurrent(Math.floor(Math.random() * HypnoPhrases[hypno].length));
  }, [hypno, setCurrent]);

  const delay = useMemo(() => 3000 - intensity * 29, [intensity]);

  const enabled = useMemo(
    () => phase === GamePhase.active && hypno !== GameHypnoType.off,
    [phase, hypno]
  );

  useLooping(onTick, delay, enabled);

  return (
    <StyledGameHypno
      key={phrase}
      initial={{ opacity: 0.3 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0.3 }}
      transition={{
        ease: [0.19, 1, 0.22, 1],
        duration: delay * 0.001 * 0.5,
      }}
    >
      {phrase}
    </StyledGameHypno>
  );
};
