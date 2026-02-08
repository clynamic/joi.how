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

// custom text mode vars
const FADE_TIME = 0.2;
let custom_opacity = 0;

export const GameHypnoText = () => {
  const [hypno] = useSetting('hypno');
  const [current, setCurrent] = useGameValue('currentHypno');
  const [phase] = useGameValue('phase');
  const [intensity] = useGameValue('intensity');
  const translate = useTranslate();

  const startTime = useMemo(() => Date.now(), []);

  const phrase = useMemo(() => {
    if (hypno.textType !== GameHypnoType.custom) {
      const phrases = HypnoPhrases[hypno.textType];
      if (phrases.length <= 0) return '';
      return translate(phrases[current % phrases.length]);
    }
    const s_el = (Date.now() - startTime) / 1000;
    const msgs = hypno.textCustom
      .filter(el => el.start < s_el && el.start + el.duration > s_el)
      .sort((a, b) => {
        if (a.start != b.start) return a.start < b.start ? -1 : 1;
        if (a.duration != b.duration) return a.duration < b.duration ? -1 : 1;
        return a.id < b.id ? -1 : 1;
      });

    const earliestStart = Math.min(...msgs.map(el => el.start));
    const soonestEnd = Math.min(...msgs.map(el => el.start + el.duration));
    custom_opacity = Math.max(
      0,
      Math.min(
        0.4,
        (s_el - earliestStart) / FADE_TIME,
        (soonestEnd - s_el) / FADE_TIME
      )
    );

    return msgs.map(el => el.text).join('\n');
  }, [current, hypno.textType, hypno.textCustom, translate, startTime]);

  const onTick = useCallback(() => {
    if (hypno.textType !== GameHypnoType.custom)
      setCurrent(
        Math.floor(Math.random() * HypnoPhrases[hypno.textType].length)
      );
    else setCurrent(p => +!p);
  }, [hypno.textType, setCurrent]);

  const delay = useMemo(() => {
    if (hypno.textType !== GameHypnoType.custom) return 3000 - intensity * 29;
    else return 100;
  }, [intensity, hypno.textType]);

  const enabled = useMemo(
    () => phase === GamePhase.active && hypno.textType !== GameHypnoType.off,
    [phase, hypno.textType]
  );

  useLooping(onTick, delay, enabled);

  return (
    <>
      {(hypno.textType !== GameHypnoType.custom && (
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
      )) || (
        <StyledGameHypno
          key={phrase}
          initial={{ opacity: 0 }}
          animate={{ opacity: custom_opacity }}
          exit={{ opacity: 0 }}
          transition={{
            ease: [0, 0, 1, 1],
            duration: FADE_TIME,
          }}
        >
          {phrase}
        </StyledGameHypno>
      )}
    </>
  );
};
