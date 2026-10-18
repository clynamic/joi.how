import { createLocalStorageProvider } from '../utils';
import type { Settings } from './Settings';
import { defaultSettings } from './Settings';

const settingsStorageKey = 'settings';

export const {
  Provider: SettingsProvider,
  useProvider: useSettings,
  useProviderSelector: useSetting,
} = createLocalStorageProvider<Settings>({
  key: settingsStorageKey,
  defaultData: defaultSettings,
});
