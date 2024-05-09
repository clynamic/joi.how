import { useEffect, useState } from 'react';
import { GamePhase, Stroke, useGameValue } from '../GameProvider';
import { playTone } from '../../utils/sound';
import { wait } from '../../utils';

export const GameSound = () => {
  const [stroke] = useGameValue('stroke');
  const [phase] = useGameValue('phase');

  const [currentPhase, setCurrentPhase] = useState(phase);

  useEffect(() => {
    switch (stroke) {
      case Stroke.up:
        playTone(425);
        break;
      case Stroke.down:
        playTone(625);
        break;
    }
  }, [stroke]);

  useEffect(() => {
    if (currentPhase == phase) return;
    if (phase === GamePhase.break) {
      (async () => {
        playTone(400);
        await wait(100);
        playTone(300);
        await wait(100);
        playTone(250);
        await wait(100);
        playTone(200);
        await wait(100);
        playTone(200);
      })();
    }
    if (currentPhase === GamePhase.break && phase === GamePhase.active) {
      (async () => {
        playTone(200);
        await wait(100);
        playTone(300);
        await wait(100);
        playTone(350);
        await wait(100);
        playTone(400);
        await wait(100);
        playTone(400);
      })();
    }
    if (phase === GamePhase.climax) {
      (async () => {
        for (let i = 0; i < 15; i++) {
          playTone(255 - i * 6);
          await wait(400);
        }
      })();
    }
    setCurrentPhase(phase);
  }, [currentPhase, phase]);

  return null;
};
