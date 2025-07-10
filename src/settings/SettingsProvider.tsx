import { useCallback } from 'react';
import { GameEvent, GameHypnoType, PlayerBody, PlayerGender } from '../types';
import { RGBA } from '../common';
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
  hypnoSpiralEnabled: boolean;
  hypnoSpiralSpinSpeed: number;
  hypnoSpiralThrobSpeed: number;
  hypnoSpiralThrobStrength: number;
  hypnoSpiralZoom: number;
  hypnoSpiralPrimary: RGBA;
  hypnoSpiralSecondary: RGBA;
  hypnoSpiralRainbowColors: boolean;
  hypnoSpiralRainbowSaturation: number;
  hypnoSpiralRainbowLightness: number;
  hypnoSpiralRainbowHueSpeed: number;
  gender: PlayerGender;
  body: PlayerBody;
  highRes: boolean;
  videoSound: boolean;
  vibrations: VibrationMode;
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
  hypnoSpiralEnabled: true,
  hypnoSpiralSpinSpeed: 1,
  hypnoSpiralThrobSpeed: 1,
  hypnoSpiralThrobStrength: 1,
  hypnoSpiralZoom: 1,
  hypnoSpiralPrimary: { r: 65, g: 105, b: 225, a: 30 },
  hypnoSpiralSecondary: { r: 0, g: 0, b: 0, a: 30 },
  hypnoSpiralRainbowColors: false,
  hypnoSpiralRainbowSaturation: 100,
  hypnoSpiralRainbowLightness: 50,
  hypnoSpiralRainbowHueSpeed: 1,
  gender: PlayerGender.male,
  body: PlayerBody.penis,
  highRes: false,
  videoSound: false,
  vibrations: VibrationMode.thump,
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
