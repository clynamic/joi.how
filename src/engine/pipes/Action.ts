import { Composer, Transformer } from '../Composer';
import { GameContext, Pipe } from '../State';

export type GameAction = {
  type: string;
  payload?: any;
};

export type ActionContext = {
  pendingActions: GameAction[];
  currentActions: GameAction[];
  dispatch: Transformer<[GameAction], GameContext>;
  handle: (
    ctx: GameContext,
    type: string,
    opts?: { consume?: boolean }
  ) => { context: GameContext; actions: GameAction[] };
};

const PLUGIN_NAMESPACE = 'core.actions';

export const assembleActionKey = (namespace: string, key: string): string => {
  return `${namespace}/${key}`;
};

export const disassembleActionKey = (
  actionKey: string
): { namespace: string; key: string } => {
  const index = actionKey.indexOf('/');
  if (index === -1) {
    throw new Error(`Invalid action key: "${actionKey}"`);
  }
  return {
    namespace: actionKey.slice(0, index),
    key: actionKey.slice(index + 1),
  };
};

export const createActionContext = (action: GameAction): Partial<GameContext> =>
  new Composer({})
    .setIn(PLUGIN_NAMESPACE, {
      pendingActions: [action],
    })
    .get();

export const dispatchAction = (action: GameAction) =>
  Composer.build<GameContext>(c =>
    c.setIn(PLUGIN_NAMESPACE, {
      pendingActions: [
        ...(c.from<ActionContext>(PLUGIN_NAMESPACE).pendingActions ?? []),
        action,
      ],
    })
  );

export const getActions = (
  context: GameContext,
  type: string,
  { consume = false }: { consume?: boolean } = {}
): { context: GameContext; actions: GameAction[] } => {
  const composer = new Composer(context);
  const { currentActions = [] } =
    composer.from<ActionContext>(PLUGIN_NAMESPACE);

  const { namespace, key } = disassembleActionKey(type);
  const isWildcard = key === '*';

  const matched: GameAction[] = [];
  const unmatched: GameAction[] = [];

  for (const action of currentActions) {
    const { namespace: actionNs, key: actionKey } = disassembleActionKey(
      action.type
    );
    const isMatch = isWildcard
      ? actionNs === namespace
      : actionNs === namespace && actionKey === key;

    if (isMatch) matched.push(action);
    else unmatched.push(action);
  }

  if (consume) {
    composer.setIn(PLUGIN_NAMESPACE, {
      currentActions: unmatched,
    });
  }

  return {
    context: composer.get(),
    actions: matched,
  };
};

/**
 * Moves actions from pending to current.
 * This prevents actions from being processed during the same frame they are created.
 * This is important because pipes later in the pipeline add new actions.
 */
export const actionPipe: Pipe = Composer.buildFocus('context', ctx =>
  ctx.setIn(PLUGIN_NAMESPACE, {
    pendingActions: [],
    currentActions:
      ctx.from<ActionContext>(PLUGIN_NAMESPACE).pendingActions ?? [],
    dispatch: dispatchAction,
    handle: (
      ctx: GameContext,
      type: string,
      opts: { consume?: boolean } = {}
    ): { context: GameContext; actions: GameAction[] } =>
      getActions(ctx, type, opts),
  })
);
