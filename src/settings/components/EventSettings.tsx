import { GameEvent, GameEventDescriptions, GameEventLabels } from '../../types';
import { useCallback } from 'react';
import {
  Fields,
  SettingsDescription,
  ToggleCard,
  ToggleTileType,
} from '../../common';
import { useSetting } from '../SettingsProvider';
import { Typography } from '@mui/material';

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
    <Fields label={'Events'}>
      <SettingsDescription>
        Check the events you want to occur during the game
      </SettingsDescription>
      {Object.keys(GameEvent).map(key => {
        const event = GameEvent[key as keyof typeof GameEvent];
        return (
          <ToggleCard
            key={event}
            value={events.includes(event)}
            onClick={() => toggleEvent(event)}
            type={ToggleTileType.check}
          >
            <Typography variant='subtitle2'>
              {GameEventLabels[event]}
            </Typography>
            <Typography variant='caption'>
              {GameEventDescriptions[event]}
            </Typography>
          </ToggleCard>
        );
      })}
    </Fields>
  );
};
