/* eslint-disable react-refresh/only-export-components */
import { MutableRefObject, useEffect, useMemo } from 'react';
import { GameEvent } from '../../types';
import {
  createSendMessage,
  GamePhase,
  GameState,
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

export type EventDataRef = MutableRefObject<EventData>;

export const rollEventDice = (data: EventDataRef) => {
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

export const handleEvent = async (event: GameEvent, data: EventDataRef) => {
  await {
    climax: climaxEvent,
    edge: edgeEvent,
    pause: pauseEvent,
    halfPace: halfPaceEvent,
    risingPace: risingPaceEvent,
    doublePace: doublePaceEvent,
    randomPace: randomPaceEvent,
    randomGrip: randomGripEvent,
    cleanUp: cleanUpEvent,
  }[event](data);
};

export const silenceEventData = (data: EventDataRef): EventDataRef => {
  return {
    get current() {
      return {
        ...data.current,
        game: {
          ...data.current.game,
          sendMessage: () => {},
        },
      };
    },
  };
};

export const GameEvents = () => {
  const [phase] = useGameValue('phase');
  const [, setPaws] = useGameValue('paws');
  const [events] = useSetting('events');
  const [, setMessages] = useGameValue('messages');
  const sendMessage = useMemo(
    () => createSendMessage(setMessages),
    [setMessages]
  );

  const data = useAutoRef<EventData>({
    game: {
      ...createStateSetters(...useGame()),
      sendMessage: sendMessage,
    },
    settings: createStateSetters(...useSettings()),
  });

  useEffect(() => {
    if (phase === GamePhase.active && events.includes(GameEvent.randomGrip)) {
      randomGripEvent(silenceEventData(data));
    }
  }, [data, events, phase, setPaws]);

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
