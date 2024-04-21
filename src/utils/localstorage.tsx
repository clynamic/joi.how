import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  PropsWithChildren,
} from 'react';

interface LocalStorageProviderOptions<T> {
  key: string;
  defaultData: T;
}

interface LocalStorageContextType<T> {
  getDataItem: <K extends keyof T>(itemKey: K) => T[K];
  setDataItem: <K extends keyof T>(itemKey: K, value: T[K]) => void;
}

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
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
  }, [key, storedValue]);

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

    const setDataItem = useCallback(
      <K extends keyof T>(itemKey: K, value: T[K]): void => {
        setData(prev => ({ ...prev, [itemKey]: value }));
      },
      [setData]
    );

    const getDataItem = useCallback(
      <K extends keyof T>(itemKey: K): T[K] => {
        return data[itemKey];
      },
      [data]
    );

    const contextValue = useMemo(
      () => ({
        getDataItem,
        setDataItem,
      }),
      [getDataItem, setDataItem]
    );

    return (
      <LocalStorageContext.Provider value={contextValue}>
        {children}
      </LocalStorageContext.Provider>
    );
  };

  const useLocalStorageHook = <K extends keyof T>(
    itemKey: K
  ): [T[K], (value: T[K]) => void] => {
    const context = useContext(LocalStorageContext);
    if (!context) {
      throw new Error('useLocalStorageHook must be used within its Provider');
    }

    const { getDataItem, setDataItem } = context;
    const item = useMemo(() => getDataItem(itemKey), [getDataItem, itemKey]);
    const updateItem = useCallback(
      (value: T[K]) => setDataItem(itemKey, value),
      [setDataItem, itemKey]
    );

    return [item, updateItem];
  };

  return { Provider, useLocalStorageHook };
}
