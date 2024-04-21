import { GameEvent, GameEventDescriptions, GameEventLabels } from '../../types';
import { useCallback, useState } from 'react';
import {
  SettingsTile,
  SettingsTitle,
  ToggleTile,
  Trailing,
} from '../../common';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquare, faSquareCheck } from '@fortawesome/free-regular-svg-icons';

export const EventSettings = () => {
  const [events, setEvents] = useState<GameEvent[]>(Object.values(GameEvent));

  const toggleEvent = useCallback(
    (event: GameEvent) => {
      if (events.includes(event)) {
        setEvents(events.filter(e => e !== event));
      } else {
        setEvents([...events, event]);
      }
    },
    [events]
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
            enabled={events.includes(event)}
            onClick={() => toggleEvent(event)}
          >
            <Trailing
              trailing={
                <h2>
                  <FontAwesomeIcon
                    icon={events.includes(event) ? faSquareCheck : faSquare}
                  />
                </h2>
              }
            >
              <strong>{GameEventLabels[event]}</strong>
              <p>{GameEventDescriptions[event]}</p>
            </Trailing>
          </ToggleTile>
        );
      })}
    </SettingsTile>
  );
};
