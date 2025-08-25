import { Composer } from '../Composer';
import { GameContext, GameState, Pipe, PipeTransformer } from '../State';

export type GameEvent = {
  type: string;
  payload?: any;
};

export type EventState = {
  pending: GameEvent[];
  current: GameEvent[];
};

export type EventContext = {
  dispatch: PipeTransformer<[GameEvent]>;
  handle: PipeTransformer<[string, PipeTransformer<[GameEvent]>]>;
};

const PLUGIN_NAMESPACE = 'core.events';

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
  Composer.over<EventState['pending']>(
    ['state', PLUGIN_NAMESPACE, 'pending'],
    (pending = []) => [...pending, event]
  );

export const handleEvent: PipeTransformer<
  [string, (event: GameEvent) => Pipe]
> = (type, fn) =>
  Composer.bind<EventState>(['state', PLUGIN_NAMESPACE], ({ current = [] }) =>
    Composer.pipe(
      ...current
        .filter(event => {
          const { namespace: ns, key: k } = readEventKey(event.type);
          const { namespace, key } = readEventKey(type);
          return key === '*' ? ns === namespace : ns === namespace && k === key;
        })
        .map(fn)
    )
  );

export class Events {
  static dispatch(event: GameEvent): Pipe {
    return Composer.bind<EventContext>(
      ['context', PLUGIN_NAMESPACE],
      ({ dispatch }) => dispatch(event)
    );
  }

  static handle(type: string, fn: (event: GameEvent) => Pipe): Pipe {
    return Composer.bind<EventContext>(
      ['context', PLUGIN_NAMESPACE],
      ({ handle }) => handle(type, fn)
    );
  }
}

/**
 * Moves events from pending to current.
 * This prevents events from being processed during the same frame they are created.
 * This is important because pipes later in the pipeline may add new events.
 */
export const eventPipe: Pipe = Composer.pipe(
  Composer.zoom<GameState>('state', state =>
    state.over<EventState>(PLUGIN_NAMESPACE, ({ pending = [] }) => ({
      pending: [],
      current: pending,
    }))
  ),
  Composer.zoom<GameContext>('context', context =>
    context.set<EventContext>(PLUGIN_NAMESPACE, {
      dispatch: dispatchEvent,
      handle: handleEvent,
    })
  )
);
