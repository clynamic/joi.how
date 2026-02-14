import styled from 'styled-components';
import { useSetting, useTranslate } from '../../settings';
import { GameHypnoType, HypnoPhrases } from '../../types';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameState } from '../hooks';
import Intensity from '../plugins/intensity';
import Hypno from '../plugins/hypno';

const StyledGameHypno = motion.create(styled.div`
  pointer-events: none;
  font-size: 4rem;
  font-weight: bold;
  -webkit-text-stroke: black 1px;
`);

export const GameHypno = () => {
  const [hypno] = useSetting('hypno');
  const { currentPhrase = 0 } = useGameState(Hypno.paths.state) ?? {};
  const { intensity = 0 } = useGameState(Intensity.paths.state) ?? {};
  const translate = useTranslate();

  const phrase = useMemo(() => {
    if (hypno === GameHypnoType.off) return '';
    const phrases = HypnoPhrases[hypno];
    if (phrases.length <= 0) return '';
    return translate(phrases[currentPhrase % phrases.length]);
  }, [currentPhrase, hypno, translate]);

  const delay = useMemo(() => 3000 - intensity * 100 * 29, [intensity]);

  if (hypno === GameHypnoType.off || !phrase) return null;

  return (
    <StyledGameHypno
      key={`${phrase}-${currentPhrase}`}
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
