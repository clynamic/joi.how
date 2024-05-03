import { GameEvent } from '../../../types';
import { wait } from '../../../utils';
import { GamePhase } from '../../GameProvider';
import { EventData } from '../GameEvents';

export const climaxEvent = (data: EventData) => {
  const {
    game: { setPhase, sendMessage, setPace, setIntensity },
    settings: { minPace, climaxChance, ruinChance },
  } = data;

  setPhase(GamePhase.finale); // this disables events
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
};
