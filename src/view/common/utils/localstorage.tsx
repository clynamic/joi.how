import { PropsWithChildren, useEffect, useMemo } from 'react';
import { createStateProvider } from './state';

interface LocalStorageProviderOptions<T> {
  key: string;
  defaultData: T;
}

export function createLocalStorageProvider<T>({
  key,
  defaultData,
}: LocalStorageProviderOptions<T>) {
  const {
    Provider: StateProvider,
    useProvider,
    useProviderSelector,
  } = createStateProvider<T>({ defaultData: defaultData });

  const LocalStorageProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const savedData = useMemo(() => {
      try {
        const item = window.localStorage.getItem(key);
        const parsed = item ? JSON.parse(item) : null;
        if (typeof defaultData === 'object' && !Array.isArray(defaultData)) {
          // this allows us to default on missing keys
          return {
            ...defaultData,
            ...(parsed ?? {}),
          };
        } else {
          return parsed ?? defaultData;
        }
      } catch (error) {
        console.error('Failed to read from localStorage:', error);
        return defaultData;
      }
    }, []);

    const LocalStorageWriter: React.FC<PropsWithChildren> = ({ children }) => {
      const [data] = useProvider();

      useEffect(() => {
        try {
          window.localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
          console.error('Failed to save to localStorage:', error);
        }
      }, [data]);

      return children;
    };

    return (
      <StateProvider defaultData={savedData}>
        <LocalStorageWriter>{children}</LocalStorageWriter>
      </StateProvider>
    );
  };

  return {
    Provider: LocalStorageProvider,
    useProvider,
    useProviderSelector,
  };
}
