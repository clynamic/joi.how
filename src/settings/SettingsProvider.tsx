/* eslint-disable react-refresh/only-export-components */

import { defaultSettings, Settings } from '../types';
import { createLocalStorageProvider } from '../utils';

const settingsStorageKey = 'settings';

const { Provider: SettingsProvider, useLocalStorageHook: useSetting } =
  createLocalStorageProvider<Settings>({
    key: settingsStorageKey,
    defaultData: defaultSettings,
  });

export { SettingsProvider, useSetting };
