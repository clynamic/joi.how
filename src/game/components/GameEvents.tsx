/* eslint-disable react-refresh/only-export-components */
import { useCallback, useEffect } from 'react';
import { CleanUpDescriptions, GameEvent } from '../../types';
import {
  GameMessage,
  GamePhase,
  PawLabels,
  Paws,
  useGameValue,
} from '../GameProvider';
import { useSetting } from '../../settings';
import {
  intensityToPaceRange,
  useLooping,
  wait,
  useAutoRef,
  round,
} from '../../utils';

export const useGameEventDice: () => () => GameEvent | null = () => {
  const roll = useCallback(
    (chance: number): boolean => Math.floor(Math.random() * chance) === 0,
    []
  );

  const data = useAutoRef({
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
    } = data.current;

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

    if (
      events.includes(GameEvent.halfPace) &&
      intensity >= 10 &&
      intensity <= 50 &&
      roll(50)
    ) {
      return GameEvent.halfPace;
    }

    if (events.includes(GameEvent.pause) && intensity >= 15 && roll(50)) {
      return GameEvent.pause;
    }

    if (events.includes(GameEvent.risingPace) && intensity >= 30 && roll(30)) {
      return GameEvent.risingPace;
    }

    return null;
  }, [data, roll]);
};

export const useHandleGameEvent: () => (
  event: GameEvent
) => Promise<void> = () => {
  const data = useAutoRef({
    messages: useGameValue('messages'),
    phase: useGameValue('phase'),
    intensity: useGameValue('intensity'),
    paws: useGameValue('paws'),
    pace: useGameValue('pace'),
    steepness: useSetting('steepness'),
    edged: useGameValue('edged'),
    minPace: useSetting('minPace'),
    maxPace: useSetting('maxPace'),
    body: useSetting('body'),
    climaxChance: useSetting('climaxChance'),
    ruinChance: useSetting('ruinChance'),
  });

  return useCallback(
    async (event: GameEvent) => {
      const {
        messages: [, setMessages],
        phase: [, setPhase],
        intensity: [intensity, setIntensity],
        pace: [pace, setPace],
        steepness: [steepness],
        paws: [paws, setPaws],
        edged: [, setEdged],
        minPace: [minPace],
        maxPace: [maxPace],
        body: [body],
        climaxChance: [climaxChance],
        ruinChance: [ruinChance],
      } = data.current;

      const sendMessage = (message: Partial<GameMessage> & { id: string }) => {
        setMessages(messages => {
          const previous = messages.find(m => m.id === message.id);
          return [
            ...messages.filter(m => m.id !== message.id),
            {
              ...previous,
              ...message,
            } as GameMessage,
          ];
        });
      };

      switch (event) {
        case GameEvent.climax:
          setPhase(GamePhase.finale);
          sendMessage({
            id: GameEvent.climax,
            title: 'Are you edging?',
            prompts: [
              {
                title: "I'm edging, master", // TODO: variables
                onClick: async () => {
                  sendMessage({
                    id: GameEvent.climax,
                    title: 'Stay on the edge, player', // TODO: variables
                    prompts: undefined,
                  });
                  setPace(minPace);
                  await wait(3000);
                  sendMessage({
                    id: GameEvent.climax,
                    description: '3...',
                  });
                  await wait(5000);
                  sendMessage({
                    id: GameEvent.climax,
                    description: '2...',
                  });
                  await wait(5000);
                  sendMessage({
                    id: GameEvent.climax,
                    description: '1...',
                  });
                  await wait(5000);

                  if (Math.random() * 100 < climaxChance) {
                    if (Math.random() * 100 < ruinChance) {
                      setPhase(GamePhase.pause);
                      sendMessage({
                        id: GameEvent.climax,
                        title: 'PAWS OFF! Ruin your orgasm!', // TODO: variables
                        description: undefined,
                      });
                      await wait(3000);
                      sendMessage({
                        id: GameEvent.climax,
                        title: 'Clench in desperation', // TODO: variables
                      });
                    } else {
                      setPhase(GamePhase.climax);
                      sendMessage({
                        id: GameEvent.climax,
                        title: 'Cum!',
                        description: undefined,
                      });
                    }
                    await wait(10000);
                    sendMessage({
                      id: GameEvent.climax,
                      title: 'Good job, player', // TODO: variables
                      prompts: [
                        {
                          title: 'Leave',
                          onClick: () => {
                            window.location.href = '/';
                          },
                        },
                      ],
                    });
                  } else {
                    setPhase(GamePhase.pause);
                    sendMessage({
                      id: GameEvent.climax,
                      title: 'PAWS OFF! Do not cum!', // TODO: variables
                      description: undefined,
                    });
                    await wait(5000);
                    sendMessage({
                      id: GameEvent.climax,
                      title: 'Good player. Let yourself cool off', // TODO: variables
                    });
                    await wait(5000);
                    sendMessage({
                      id: GameEvent.climax,
                      title: 'Leave now.',
                      prompts: [
                        {
                          title: 'Leave',
                          onClick: () => {
                            window.location.href = '/';
                          },
                        },
                      ],
                    });
                  }
                },
              },
              {
                title: "I can't",
                onClick: async () => {
                  sendMessage({
                    id: GameEvent.climax,
                    title: "You're pathetic. Stop for a moment",
                  });
                  setPhase(GamePhase.pause);
                  setIntensity(0); // TODO: this essentially restarts the game. is this a good idea?
                  await wait(20000);
                  sendMessage({
                    id: GameEvent.climax,
                    title: 'Start pawing again', // TODO: variables
                    duration: 5000,
                  });
                  setPace(minPace);
                  setPhase(GamePhase.active);
                  await wait(15000);
                },
              },
            ],
          });
          break;
        case GameEvent.edge:
          setEdged(true);
          setPace(minPace);
          sendMessage({
            id: GameEvent.edge,
            title: `You should getting close to the edge. Don't cum yet.`,
            duration: 10000,
          });
          await wait(10000);
          break;
        case GameEvent.pause: {
          sendMessage({
            id: GameEvent.pause,
            title: 'Stop stroking!',
          });
          setPhase(GamePhase.pause);
          const duration = Math.ceil(-100 * intensity + 12000);
          await wait(duration);
          sendMessage({
            id: GameEvent.pause,
            title: 'Start stroking again!',
            duration: 5000,
          });
          setPhase(GamePhase.active);
          break;
        }
        case GameEvent.halfPace: {
          sendMessage({
            id: GameEvent.halfPace,
            title: 'Half pace!',
          });
          const newPace = Math.max(round(pace / 2), minPace);
          setPace(newPace);
          const duration = Math.ceil(Math.random() * 20000) + 12000;
          const durationPortion = duration / 3;
          sendMessage({
            id: GameEvent.halfPace,
            description: '3...',
          });
          await wait(durationPortion);
          sendMessage({
            id: GameEvent.halfPace,
            description: '2...',
          });
          await wait(durationPortion);
          sendMessage({
            id: GameEvent.halfPace,
            description: '1...',
          });
          await wait(durationPortion);
          sendMessage({
            id: GameEvent.halfPace,
            title: 'Done! Back to normal pace',
            description: undefined,
            duration: 5000,
          });
          setPace(() => {
            const { min, max } = intensityToPaceRange(intensity, steepness, {
              min: minPace,
              max: maxPace,
            });
            return round(Math.random() * (max - min) + min);
          });
          break;
        }
        case GameEvent.risingPace: {
          sendMessage({
            id: GameEvent.risingPace,
            title: 'Rising pace strokes!',
          });
          const acceleration = Math.round(100 / Math.min(intensity, 35));
          const { max } = intensityToPaceRange(intensity, steepness, {
            min: minPace,
            max: maxPace,
          });
          const portion = (max - minPace) / acceleration;
          let newPace = minPace;
          setPace(newPace);
          for (let i = 0; i < acceleration; i++) {
            await wait(10000);
            newPace = round(newPace + portion);
            setPace(newPace);
            sendMessage({
              id: GameEvent.risingPace,
              title: `Pace rising to ${newPace}!`,
              duration: 5000,
            });
          }
          await wait(10000);
          sendMessage({
            id: GameEvent.risingPace,
            title: 'Stay at this pace for a bit',
            duration: 5000,
          });
          await wait(15000);
          break;
        }
        case GameEvent.doublePace: {
          sendMessage({
            id: GameEvent.doublePace,
            title: 'Double pace!',
          });
          const newPace = Math.min(round(pace * 2), maxPace);
          setPace(newPace);
          const duration = 9000;
          const durationPortion = duration / 3;
          sendMessage({
            id: GameEvent.doublePace,
            description: '3...',
          });
          await wait(durationPortion);
          sendMessage({
            id: GameEvent.doublePace,
            description: '2...',
          });
          await wait(durationPortion);
          sendMessage({
            id: GameEvent.doublePace,
            description: '1...',
          });
          await wait(durationPortion);
          sendMessage({
            id: GameEvent.doublePace,
            title: 'Done! Back to normal pace',
            description: undefined,
            duration: 5000,
          });
          setPace(() => {
            const { min, max } = intensityToPaceRange(intensity, steepness, {
              min: minPace,
              max: maxPace,
            });
            return round(Math.random() * (max - min) + min);
          });
          break;
        }
        case GameEvent.randomPace: {
          const { min, max } = intensityToPaceRange(intensity, steepness, {
            min: minPace,
            max: maxPace,
          });
          const newPace = round(Math.random() * (max - min) + min);
          setPace(newPace);
          sendMessage({
            id: GameEvent.randomPace,
            title: `Pace changed to ${newPace}!`,
            duration: 5000,
          });
          await wait(9000);
          break;
        }
        case GameEvent.randomGrip: {
          let newPaws: Paws;
          const seed = Math.random();
          if (seed < 0.33) newPaws = paws === Paws.both ? Paws.left : Paws.both;
          if (seed < 0.66)
            newPaws = paws === Paws.left ? Paws.right : Paws.left;
          newPaws = paws === Paws.right ? Paws.both : Paws.right;
          setPaws(newPaws);
          sendMessage({
            id: GameEvent.randomGrip,
            title: `Grip changed to ${PawLabels[newPaws]}!`,
            duration: 5000,
          });
          await wait(10000);
          break;
        }
        case GameEvent.cleanUp:
          setPhase(GamePhase.pause);
          sendMessage({
            id: GameEvent.cleanUp,
            title: `Lick up any ${CleanUpDescriptions[body]}`,
            duration: undefined,
            prompts: [
              {
                title: `I'm done, master`, // TODO: variables
                onClick: () => {
                  sendMessage({
                    id: GameEvent.cleanUp,
                    title: 'Good player', // TODO: variables
                    duration: 5000,
                    prompts: undefined,
                  });
                  setPhase(GamePhase.active);
                },
              },
            ],
          });
          break;
      }
    },
    [data]
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
