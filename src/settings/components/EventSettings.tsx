import { SettingsTile } from './SettingsTile';
import { GameEvent, GameEventDescriptions, GameEventLabels } from '../../types';
import { useCallback, useState } from 'react';
import { ToggleTile, Trailing } from '../../common';
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
    <SettingsTile grid label={'Events'}>
      <p>Click to enable/disable occurance of each event.</p>
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
