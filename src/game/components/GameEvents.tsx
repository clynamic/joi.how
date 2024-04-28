/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect } from 'react';
import { GameEvent } from '../../types';
import { GamePhase, Paws, useGameValue } from '../GameProvider';
import { useSetting } from '../../settings';
import { intensityToPaceRange, useLooping, wait } from '../../utils';
import { useAutoRef } from '../../utils/refs';
import { round } from '../../utils/round';

export const useGameEventDice: () => () => GameEvent | null = () => {
  const roll = useCallback(
    (chance: number): boolean => Math.floor(Math.random() * chance) === 0,
    []
  );

  const diceData = useAutoRef({
    events: useSetting('events'),
    phase: useGameValue('phase'),
    intensity: useGameValue('intensity'),
    edged: useGameValue('edged'),
  });

  return useCallback(() => {
    const {
      events: [events],
      phase: [phase],
      intensity: [intensity],
      edged: [edged],
    } = diceData.current;

    if (phase !== GamePhase.active) return null;

    if (events.includes(GameEvent.climax) && intensity >= 100 && edged) {
      return GameEvent.climax;
    }

    if (events.includes(GameEvent.edge) && intensity >= 90 && !edged) {
      return GameEvent.edge;
    }

    if (events.includes(GameEvent.randomPace) && roll(10)) {
      return GameEvent.randomPace;
    }

    if (events.includes(GameEvent.cleanUp) && intensity >= 75 && roll(25)) {
      return GameEvent.cleanUp;
    }

    if (events.includes(GameEvent.randomGrip) && roll(50)) {
      return GameEvent.randomGrip;
    }

    if (
      events.includes(GameEvent.doublePace) &&
      intensity >= 20 &&
      roll(50 - (intensity - 20) * 0.25)
    ) {
      return GameEvent.doublePace;
    }

    if (events.includes(GameEvent.halfPace) && intensity <= 50 && roll(50)) {
      return GameEvent.halfPace;
    }

    if (events.includes(GameEvent.pause) && intensity >= 15 && roll(50)) {
      return GameEvent.pause;
    }

    if (events.includes(GameEvent.risingPace) && intensity >= 30 && roll(30)) {
      return GameEvent.risingPace;
    }

    return null;
  }, [diceData, roll]);
};

export const useHandleGameEvent: () => (
  event: GameEvent
) => Promise<void> = () => {
  const handleData = useAutoRef({
    phase: useGameValue('phase'),
    intensity: useGameValue('intensity'),
    paws: useGameValue('paws'),
    pace: useGameValue('pace'),
    steepness: useSetting('steepness'),
  });

  return useCallback(
    async (event: GameEvent) => {
      const {
        phase: [, setPhase],
        intensity: [intensity],
        pace: [, setPace],
        steepness: [steepness],
        paws: [, setPaws],
      } = handleData.current;

      switch (event) {
        case GameEvent.climax:
          console.log('climax');
          break;
        case GameEvent.edge:
          console.log('edge');
          break;
        case GameEvent.pause: {
          setPhase(GamePhase.pause);
          const duration = Math.ceil(-100 * intensity + 12000);
          await wait(duration);
          setPhase(GamePhase.active);
          break;
        }
        case GameEvent.halfPace:
          console.log('halfPace');
          break;
        case GameEvent.risingPace:
          console.log('risingPace');
          break;
        case GameEvent.doublePace:
          console.log('doublePace');
          break;
        case GameEvent.randomPace:
          setPace(prev => {
            const { min, max } = intensityToPaceRange(prev, steepness);
            return round(Math.random() * (max - min) + min);
          });
          await wait(9000);
          break;
        case GameEvent.randomGrip: {
          setPaws(prev => {
            const seed = Math.random();
            if (seed < 0.33) return prev === Paws.both ? Paws.left : Paws.both;
            if (seed < 0.66) return prev === Paws.left ? Paws.right : Paws.left;
            return prev === Paws.right ? Paws.both : Paws.right;
          });
          await wait(10000);
          break;
        }
        case GameEvent.cleanUp:
          console.log('cleanUp');
          break;
      }
    },
    [handleData]
  );
};

export const GameEvents = () => {
  const [phase] = useGameValue('phase');
  const [, setPaws] = useGameValue('paws');
  const [events] = useSetting('events');

  const rollEvent = useGameEventDice();
  const handleEvent = useHandleGameEvent();

  useEffect(() => {
    if (phase === GamePhase.active && events.includes(GameEvent.randomGrip)) {
      setPaws(prev => {
        if (prev !== Paws.none) return prev;
        return [Paws.left, Paws.right].sort(() => Math.random() - 0.5)[0];
      });
    }
  }, [events, phase, setPaws]);

  useLooping(
    async () => {
      const event = rollEvent();
      if (event) {
        await handleEvent(event);
      }
    },
    1000,
    phase === GamePhase.active
  );

  return null;
};
