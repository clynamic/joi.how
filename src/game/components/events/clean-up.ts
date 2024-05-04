import { GameEvent, CleanUpDescriptions } from '../../../types';
import { GamePhase } from '../../GameProvider';
import { EventDataRef } from '../GameEvents';

export const cleanUpEvent = async (data: EventDataRef) => {
  const {
    game: { setPhase, sendMessage },
    settings: { body },
  } = data.current;

  setPhase(GamePhase.pause);
  sendMessage({
    id: GameEvent.cleanUp,
    title: `Lick up any ${CleanUpDescriptions[body]}`,
    duration: undefined,
    prompts: [
      {
        title: `I'm done, $master`,
        onClick: () => {
          sendMessage({
            id: GameEvent.cleanUp,
            title: 'Good $player',
            duration: 5000,
            prompts: undefined,
          });
          setPhase(GamePhase.active);
        },
      },
    ],
  });
};
