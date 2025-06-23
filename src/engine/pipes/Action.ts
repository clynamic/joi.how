import { fromNamespace, namespaced } from '../Namespace';
import { GameContext, Pipe } from '../State';

export type GameAction = {
  type: string;
  payload?: any;
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

export const createActionContext = (
  action: GameAction
): Partial<GameContext> => {
  return namespaced(PLUGIN_NAMESPACE, {
    pendingActions: [action],
  })({});
};

export const dispatchAction = (
  context: GameContext,
  action: GameAction
): GameContext => {
  const { pendingActions = [] } = fromNamespace(context, PLUGIN_NAMESPACE);

  return namespaced(PLUGIN_NAMESPACE, {
    pendingActions: [...pendingActions, action],
  })(context);
};

export const getActions = (
  context: GameContext,
  type: string,
  { consume = false }: { consume?: boolean } = {}
): { context: GameContext; actions: GameAction[] } => {
  const { currentActions = [] } = fromNamespace(context, PLUGIN_NAMESPACE);

  const { namespace, key } = disassembleActionKey(type);
  const isWildcard = key === '*';

  const matched: GameAction[] = [];
  const unmatched: GameAction[] = [];

  for (const action of currentActions) {
    const { namespace: actionNamespace, key: actionKey } = disassembleActionKey(
      action.type
    );

    const isMatch = isWildcard
      ? actionNamespace === namespace
      : actionNamespace === namespace && actionKey === key;

    if (isMatch) matched.push(action);
    else unmatched.push(action);
  }

  return {
    context: consume
      ? namespaced(PLUGIN_NAMESPACE, {
          currentActions: unmatched,
        })(context)
      : context,
    actions: matched,
  };
};

export const actionPipeline: Pipe = ({ state, context }) => {
  const { pendingActions = [] } = fromNamespace(context, PLUGIN_NAMESPACE);

  return {
    state,
    context: namespaced(PLUGIN_NAMESPACE, {
      pendingActions: [],
      currentActions: pendingActions,
    })(context),
  };
};
