import { defaultSettings, Settings } from '../types';
import { createLocalStorageProvider } from '../utils';

const settingsStorageKey = 'settings';

export const {
  Provider: SettingsProvider,
  useProvider: useSettings,
  useProviderSelector: useSetting,
} = createLocalStorageProvider<Settings>({
  key: settingsStorageKey,
  defaultData: defaultSettings,
});
