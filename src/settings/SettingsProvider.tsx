import { useCallback } from 'react';
import { GameEvent, GameHypnoType, PlayerBody, PlayerGender } from '../types';
import { createLocalStorageProvider, VibrationMode } from '../utils';
import { interpolateWith } from '../utils/translate';

export interface Settings {
  gameDuration: number;
  warmupDuration: number;
  climaxChance: number;
  ruinChance: number;
  minPace: number;
  maxPace: number;
  steepness: number;
  timeshift: number;
  events: GameEvent[];
  hypno: GameHypnoType;
  gender: PlayerGender;
  body: PlayerBody;
  highRes: boolean;
  videoSound: boolean;
  vibrations: VibrationMode;
  imageDuration: number;
  intenseImages: boolean;
}

export const defaultSettings: Settings = {
  gameDuration: 900,
  warmupDuration: 0,
  climaxChance: 100,
  ruinChance: 0,
  minPace: 1,
  maxPace: 5,
  steepness: 0.5,
  timeshift: 0.5,
  events: Object.values(GameEvent),
  hypno: GameHypnoType.joi,
  gender: PlayerGender.male,
  body: PlayerBody.penis,
  highRes: false,
  videoSound: false,
  vibrations: VibrationMode.thump,
  imageDuration: 20,
  intenseImages: true,
};

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
