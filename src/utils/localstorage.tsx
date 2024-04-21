import { useState, useEffect, PropsWithChildren, useCallback } from 'react';
import {
  createContext,
  useContextSelector,
  useContext,
} from 'use-context-selector';

interface LocalStorageProviderOptions<T> {
  key: string;
  defaultData: T;
}

interface LocalStorageContextType<T> {
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
}

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return {
        ...initialValue,
        ...(item ? JSON.parse(item) : {}),
      };
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [storedValue, key]);

  return [storedValue, setStoredValue];
}

export function createLocalStorageProvider<T>(
  options: LocalStorageProviderOptions<T>
) {
  const LocalStorageContext = createContext<
    LocalStorageContextType<T> | undefined
  >(undefined);

  const Provider: React.FC<PropsWithChildren> = ({ children }) => {
    const [data, setData] = useLocalStorage<T>(
      options.key,
      options.defaultData
    );

    const contextValue = { data, setData };

    return (
      <LocalStorageContext.Provider value={contextValue}>
        {children}
      </LocalStorageContext.Provider>
    );
  };

  const useProvider = (): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const context = useContext(LocalStorageContext);
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
  ): [T[K], (value: T[K]) => void] {
    const selected = useContextSelector(LocalStorageContext, context => {
      if (!context) {
        throw new Error('useProvider must be used within its Provider');
      }

      return context.data[key];
    });
    const setData = useContextSelector(LocalStorageContext, context => {
      if (!context) {
        throw new Error('useProvider must be used within its Provider');
      }

      return context.setData;
    });

    const setSelected = useCallback(
      (value: T[K]) => {
        setData(prev => ({ ...prev, [key]: value }));
      },
      [setData, key]
    );

    return [selected, setSelected];
  }

  return { Provider, useProvider, useProviderSelector };
}
