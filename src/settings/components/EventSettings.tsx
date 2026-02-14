import { DiceEvent, DiceEventDescriptions, DiceEventLabels } from '../../types';
import { useCallback } from 'react';
import { Fields, JoiToggleTile, SettingsDescription } from '../../common';
import { useSetting } from '../SettingsProvider';

export const EventSettings = () => {
  const [events, setEvents] = useSetting('events');

  const toggleEvent = useCallback(
    (event: DiceEvent) => {
      if (events.includes(event)) {
        setEvents(events.filter(e => e !== event));
      } else {
        setEvents([...events, event]);
      }
    },
    [events, setEvents]
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
