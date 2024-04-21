/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  PropsWithChildren,
} from 'react';
import { defaultSettings, Settings } from '../types';

interface SettingsContextType {
  getSetting: <K extends keyof Settings>(key: K) => Settings[K];
  setSetting: (key: keyof Settings, value: Settings[keyof Settings]) => void;
}

const settingsStorageKey = 'settings';

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const storedSettings = localStorage.getItem(settingsStorageKey);
    return {
      ...defaultSettings,
      ...(storedSettings ? JSON.parse(storedSettings) : {}),
    };
  });

  useEffect(() => {
    localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
  }, [settings]);

  const setSetting = useCallback(
    (key: keyof Settings, value: Settings[keyof Settings]) => {
      setSettings(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const getSetting = useCallback(
    <K extends keyof Settings>(key: K): Settings[K] => {
      return settings[key];
    },
    [settings]
  );

  const contextValue = useMemo(
    () => ({ getSetting, setSetting }),
    [getSetting, setSetting]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSetting = <K extends keyof Settings>(
  key: K
): [Settings[K], (value: Settings[K]) => void] => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSetting must be used within a SettingsProvider');
  }

  const { getSetting, setSetting } = context;
  const setting = useMemo(() => getSetting(key), [getSetting, key]);

  const updateSetting = useCallback(
    (value: Settings[K]) => {
      setSetting(key, value);
    },
    [setSetting, key]
  );

  return [setting, updateSetting];
};
