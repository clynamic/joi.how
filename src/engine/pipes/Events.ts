import { Composer, Transformer } from '../Composer';
import { GameContext, Pipe } from '../State';

export type GameEvent = {
  type: string;
  payload?: any;
};

export type EventContext = {
  pending: GameEvent[];
  current: GameEvent[];
  dispatch: Transformer<[GameEvent], GameContext>;
  handle: (
    ctx: GameContext,
    type: string,
    opts?: { consume?: boolean }
  ) => { context: GameContext; events: GameEvent[] };
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

export const createEventContext = (event: GameEvent): Partial<GameContext> =>
  new Composer({})
    .setIn(PLUGIN_NAMESPACE, {
      pending: [event],
    })
    .get();

export const dispatchEvent = (event: GameEvent) =>
  Composer.build<GameContext>(c =>
    c.setIn(PLUGIN_NAMESPACE, {
      pending: [
        ...(c.from<EventContext>(PLUGIN_NAMESPACE).pending ?? []),
        event,
      ],
    })
  );

export const getEvents = (
  context: GameContext,
  type: string,
  { consume = false }: { consume?: boolean } = {}
): { context: GameContext; events: GameEvent[] } => {
  const composer = new Composer(context);
  const { current = [] } = composer.from<EventContext>(PLUGIN_NAMESPACE);

  const { namespace, key } = readEventKey(type);
  const isWildcard = key === '*';

  const matched: GameEvent[] = [];
  const unmatched: GameEvent[] = [];

  for (const event of current) {
    const { namespace: eventNamespace, key: eventKey } = readEventKey(
      event.type
    );
    const isMatch = isWildcard
      ? eventNamespace === namespace
      : eventNamespace === namespace && eventKey === key;

    if (isMatch) matched.push(event);
    else unmatched.push(event);
  }

  if (consume) {
    composer.setIn(PLUGIN_NAMESPACE, {
      current: unmatched,
    });
  }

  return {
    context: composer.get(),
    events: matched,
  };
};

/**
 * Moves events from pending to current.
 * This prevents events from being processed during the same frame they are created.
 * This is important because pipes later in the pipeline may add new events.
 */
export const eventPipe: Pipe = Composer.buildFocus('context', ctx =>
  ctx.setIn(PLUGIN_NAMESPACE, {
    pending: [],
    current: ctx.from<EventContext>(PLUGIN_NAMESPACE).pending ?? [],
    dispatch: dispatchEvent,
    handle: (
      ctx: GameContext,
      type: string,
      opts: { consume?: boolean } = {}
    ): { context: GameContext; events: GameEvent[] } =>
      getEvents(ctx, type, opts),
  })
);
