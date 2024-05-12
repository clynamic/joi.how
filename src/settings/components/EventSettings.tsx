import { GameEvent, GameEventDescriptions, GameEventLabels } from '../../types';
import { useCallback } from 'react';
import {
  SettingsTile,
  SettingsTitle,
  ToggleTile,
  ToggleTileType,
} from '../../common';
import { useSetting } from '../SettingsProvider';

export const EventSettings = () => {
  const [events, setEvents] = useSetting('events');

  const toggleEvent = useCallback(
    (event: GameEvent) => {
      if (events.includes(event)) {
        setEvents(events.filter(e => e !== event));
      } else {
        setEvents([...events, event]);
      }
    },
    [events, setEvents]
  );

  return (
    <SettingsTile label={'Events'}>
      <SettingsTitle>
        Click to enable/disable occurance of each event.
      </SettingsTitle>
      {Object.keys(GameEvent).map(key => {
        const event = GameEvent[key as keyof typeof GameEvent];
        return (
          <ToggleTile
            key={event}
            value={events.includes(event)}
            onClick={() => toggleEvent(event)}
            type={ToggleTileType.check}
          >
            <strong>{GameEventLabels[event]}</strong>
            <p>{GameEventDescriptions[event]}</p>
          </ToggleTile>
        );
      })}
    </SettingsTile>
  );
};
