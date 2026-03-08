import { useCallback } from 'react';
import { createLocalStorageProvider } from '../utils';
import { interpolateWith } from '../utils/translate';
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

const removeTrailingComma = (str: string): string => {
  return str.trim().replace(/,$/, '');
};

export const useTranslate = (): ((value: string) => string) => {
  const [gender] = useSetting('gender');
  const [hypno] = useSetting('hypno');
  const [body] = useSetting('body');

  return useCallback(
    (value: string) =>
      removeTrailingComma(
        interpolateWith(value, {
          player: {
            male: 'boy',
            female: 'girl',
            other: 'pup',
          }[gender],
          master: {
            off: '',
            joi: '',
            breeding: '',
            maledom: 'master',
            femdom: 'mistress',
          }[hypno],
          hands: {
            off: 'hands',
            joi: 'hands',
            breeding: 'hands',
            maledom: 'paws',
            femdom: 'paws',
          }[hypno],
          part: {
            penis: 'cock',
            vagina: 'pussy',
            neuter: 'mound',
          }[body],
          stroke: {
            penis: 'stroke',
            vagina: 'paw',
            neuter: 'paw',
          }[body],
        })
      ),
    [body, gender, hypno]
  );
};
