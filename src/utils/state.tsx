import { useState, PropsWithChildren, useCallback } from 'react';
import {
  createContext,
  useContext,
  useContextSelector,
} from 'use-context-selector';

interface StateProviderOptions<T> {
  defaultData: T;
}

interface StateContextType<T> {
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
}

export function createStateProvider<T>({
  defaultData: globalDefaultData,
}: StateProviderOptions<T>) {
  const StateContext = createContext<StateContextType<T> | undefined>(
    undefined
  );

  const Provider: React.FC<
    Partial<StateProviderOptions<T>> & PropsWithChildren
  > = ({ defaultData, children }) => {
    const [data, setData] = useState<T>(() => {
      if (
        typeof globalDefaultData === 'object' &&
        !Array.isArray(globalDefaultData)
      ) {
        // this allows us to default on missing keys
        return {
          ...globalDefaultData,
          ...(defaultData ?? {}),
        };
      } else {
        return defaultData ?? globalDefaultData;
      }
    });

    const contextValue = { data, setData };

    return (
      <StateContext.Provider value={contextValue}>
        {children}
      </StateContext.Provider>
    );
  };

  const useProvider = (): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const context = useContext(StateContext);
    if (!context) {
      throw new Error('useProvider must be used within its Provider');
    }

    return [context.data, context.setData];
  };

  /**
   * Uses useContextSelector to select a specific key from the provider.
   * This allows us to re-render only when the selected key changes.
   * @param key
   * @returns
   */
  function useProviderSelector<K extends keyof T>(
    key: K
  ): [T[K], React.Dispatch<React.SetStateAction<T[K]>>] {
    const selected = useContextSelector(StateContext, context => {
      if (!context) {
        throw new Error('useProvider must be used within its Provider');
      }

      return context.data[key];
    });
    const setData = useContextSelector(StateContext, context => {
      if (!context) {
        throw new Error('useProvider must be used within its Provider');
      }

      return context.setData;
    });

    const setSelected = useCallback(
      (value: React.SetStateAction<T[K]>) => {
        setData(data => {
          return {
            ...data,
            [key]: value instanceof Function ? value(data[key]) : value,
          };
        });
      },
      [setData, key]
    );

    return [selected, setSelected];
  }

  return { Provider, useProvider, useProviderSelector };
}
