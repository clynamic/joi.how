import {
  DiceEvent,
  DiceEventDescriptions,
  DiceEventLabels,
} from '../../../game/classic/dice/events';
import { useCallback } from 'react';
import { Fields, JoiToggleTile, SettingsDescription } from '../../common';
import { useKeys } from '../../bridge/hooks';
import { dealerKeys } from '../../../game/classic/dice';

export const EventSettings = () => {
  const [{ events }, set] = useKeys(dealerKeys);

  const toggleEvent = useCallback(
    (event: DiceEvent) => {
      if (events.includes(event)) {
        set(
          'events',
          events.filter(e => e !== event)
        );
      } else {
        set('events', [...events, event]);
      }
    },
    [events, set]
  );

  return (
    <Fields label={'Events'}>
      <SettingsDescription>
        Check the events you want to occur during the game
      </SettingsDescription>
      {Object.keys(DiceEvent).map(key => {
        const event = DiceEvent[key as keyof typeof DiceEvent];
        return (
          <JoiToggleTile
            key={event}
            value={events.includes(event)}
            onClick={() => toggleEvent(event)}
            type={'check'}
          >
            <h6 className='subtitle'>{DiceEventLabels[event]}</h6>
            <p className='caption'>{DiceEventDescriptions[event]}</p>
          </JoiToggleTile>
        );
      })}
    </Fields>
  );
};
