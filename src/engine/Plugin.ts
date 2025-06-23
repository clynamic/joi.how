import { fromNamespace, namespaced } from './Namespace';

export function createPluginInterface<StateShape = any, ContextShape = any>(
  namespace: string
) {
  let newState: any = undefined;
  let newContext: any = undefined;

  return {
    getState: (state: any): StateShape =>
      fromNamespace<StateShape>(state, namespace),
    setState: (state: any, value: Partial<StateShape>) => {
      newState = namespaced(namespace, value)(state);
    },

    getContext: (context: any): ContextShape =>
      fromNamespace<ContextShape>(context, namespace),
    setContext: (context: any, value: Partial<ContextShape>) => {
      newContext = namespaced(namespace, value)(context);
    },

    readState: <T = any>(state: any, ns: string): T =>
      fromNamespace<T>(state, ns),
    writeState: (state: any, ns: string, value: object) => {
      newState = namespaced(ns, value)(state);
    },
    readContext: <T = any>(context: any, ns: string): T =>
      fromNamespace<T>(context, ns),
    writeContext: (context: any, ns: string, value: object) => {
      newContext = namespaced(ns, value)(context);
    },

    commit: () => ({
      state: newState,
      context: newContext,
    }),
  };
}
