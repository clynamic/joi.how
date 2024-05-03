/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react';
import { GameEvent } from '../../types';
import {
  createSendMessage,
  GamePhase,
  GameState,
  Paws,
  useGame,
  useGameValue,
} from '../GameProvider';
import { Settings, useSetting, useSettings } from '../../settings';
import {
  useLooping,
  useAutoRef,
  createStateSetters,
  StateWithSetters,
} from '../../utils';
import {
  cleanUpEvent,
  climaxEvent,
  doublePaceEvent,
  edgeEvent,
  halfPaceEvent,
  pauseEvent,
  randomGripEvent,
  randomPaceEvent,
  risingPaceEvent,
} from './events';

export interface EventData {
  game: StateWithSetters<GameState> & {
    sendMessage: ReturnType<typeof createSendMessage>;
  };
  settings: StateWithSetters<Settings>;
}

export const rollEventDice = (data: React.MutableRefObject<EventData>) => {
  const {
    game: { intensity, phase, edged },
    settings: { events },
  } = data.current;

  const roll = (chance: number): boolean =>
    Math.floor(Math.random() * chance) === 0;

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
};

export const handleEvent = async (
  event: GameEvent,
  data: React.MutableRefObject<EventData>
) => {
  // you might notice how we pass current, and not the ref itself.
  // this is for simplicity. it could cause a problem, when
  // an event uses the wait function, and later sets state based on
  // outdated data. in some events, such as doublePace, this is
  // an issue, but its minor, and I am leaving it as is for now.
  switch (event) {
    case GameEvent.climax:
      return climaxEvent(data.current);
    case GameEvent.edge:
      return edgeEvent(data.current);
    case GameEvent.pause:
      return pauseEvent(data.current);
    case GameEvent.halfPace:
      return halfPaceEvent(data.current);
    case GameEvent.risingPace:
      return risingPaceEvent(data.current);
    case GameEvent.doublePace:
      return doublePaceEvent(data.current);
    case GameEvent.randomPace:
      return randomPaceEvent(data.current);
    case GameEvent.randomGrip:
      return randomGripEvent(data.current);
    case GameEvent.cleanUp:
      return cleanUpEvent(data.current);
  }
};

export const GameEvents = () => {
  const [phase] = useGameValue('phase');
  const [, setPaws] = useGameValue('paws');
  const [events] = useSetting('events');

  const data = useAutoRef<EventData>({
    game: {
      ...createStateSetters(...useGame()),
      sendMessage: createSendMessage(useGame()[1]),
    },
    settings: createStateSetters(...useSettings()),
  });

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
      const event = rollEventDice(data);
      if (event) {
        await handleEvent(event, data);
      }
    },
    1000,
    phase === GamePhase.active
  );

  return null;
};
