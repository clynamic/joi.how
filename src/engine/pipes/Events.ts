import { lensFromPath } from '../Lens';
import { Composer } from '../Composer';
import { GameFrame, GameState, Pipe, PipeTransformer } from '../State';

export type GameEvent = {
  type: string;
  payload?: any;
};

export type EventState = {
  pending: GameEvent[];
  current: GameEvent[];
};

const PLUGIN_NAMESPACE = 'core.events';

const eventStateLens = lensFromPath<GameFrame, EventState>(['state', PLUGIN_NAMESPACE]);
const pendingLens = lensFromPath<GameFrame, GameEvent[]>(['state', PLUGIN_NAMESPACE, 'pending']);

export const getEventKey = (namespace: string, key: string): string => {
  return `${namespace}/${key}`;
};

export const readEventKey = (
  key: string
): { namespace: string; key: string } => {
  const index = key.indexOf('/');
  if (index === -1) {
    throw new Error(`Invalid event key: "${key}"`);
  }
  return {
    namespace: key.slice(0, index),
    key: key.slice(index + 1),
  };
};

export const dispatchEvent: PipeTransformer<[GameEvent]> = event =>
  pendingLens.over((pending = []) => [...pending, event]);

export const handleEvent: PipeTransformer<
  [string, (event: GameEvent) => Pipe]
> = (type, fn) => {
  const { namespace, key } = readEventKey(type);
  const isWildcard = key === '*';
  const prefix = namespace + '/';

  return (obj: GameFrame): GameFrame => {
    const state = eventStateLens.get(obj);
    const current = state?.current;
    if (!current || current.length === 0) return obj;
    let result: GameFrame = obj;
    for (const event of current) {
      if (isWildcard ? event.type.startsWith(prefix) : event.type === type) {
        result = fn(event)(result);
      }
    }
    return result;
  };
};

export class Events {
  static dispatch(event: GameEvent): Pipe {
    return dispatchEvent(event);
  }

  static handle(type: string, fn: (event: GameEvent) => Pipe): Pipe {
    return handleEvent(type, fn);
  }
}

/**
 * Moves events from pending to current.
 * This prevents events from being processed during the same frame they are created.
 * This is important because pipes later in the pipeline may add new events.
 */
export const eventPipe: Pipe = Composer.zoom<GameState>(
  'state',
  Composer.over<EventState>(PLUGIN_NAMESPACE, ({ pending = [] }) => ({
    pending: [],
    current: pending,
  }))
);
