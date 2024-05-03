import { GameEvent, CleanUpDescriptions } from '../../../types';
import { GamePhase } from '../../GameProvider';
import { EventData } from '../GameEvents';

export const cleanUpEvent = async (data: EventData) => {
  const {
    game: { setPhase, sendMessage },
    settings: { body },
  } = data;

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
};
