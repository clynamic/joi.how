import { useCallback } from 'react';
import { GameEvent, GameHypnoType, PlayerBody, PlayerGender } from '../types';
import { RGBA } from '../common';
import { createLocalStorageProvider, VibrationMode } from '../utils';
import { interpolateWith } from '../utils/translate';

export interface HypnoTextEntry {
  id: number;
  text: string;
  start: number;
  duration: number;
}

export interface HypnoSettingsType {
  textType: GameHypnoType;
  textCustomMaster: string;
  textCustomHands: string;
  textCustom: HypnoTextEntry[];
  spiralEnabled: boolean;
  spiralSpinSpeed: number;
  spiralThrobSpeed: number;
  spiralThrobStrength: number;
  spiralZoom: number;
  spiralPrimary: RGBA;
  spiralSecondary: RGBA;
  spiralRainbowColors: boolean;
  spiralRainbowSaturation: number;
  spiralRainbowLightness: number;
  spiralRainbowHueSpeed: number;
}

export const defaultHypnoSettings: HypnoSettingsType = {
  textType: GameHypnoType.joi,
  textCustomMaster: 'master',
  textCustomHands: 'hands',
  textCustom: [],
  spiralEnabled: true,
  spiralSpinSpeed: 1,
  spiralThrobSpeed: 1,
  spiralThrobStrength: 1,
  spiralZoom: 1,
  spiralPrimary: { r: 65, g: 105, b: 225, a: 30 },
  spiralSecondary: { r: 0, g: 0, b: 0, a: 30 },
  spiralRainbowColors: false,
  spiralRainbowSaturation: 100,
  spiralRainbowLightness: 50,
  spiralRainbowHueSpeed: 1,
}

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
  hypno: HypnoSettingsType;
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
  hypno: defaultHypnoSettings,
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

export function subsetting<
  S extends Record<string, any>,
  K extends keyof S
>(
  [state, setState]: readonly [S, React.Dispatch<React.SetStateAction<S>>],
  key: K
) {
  const set = (v: S[K] | ((prev: S[K]) => S[K])) => setState((p: any) => ({...p, [key]: v instanceof Function ? v(state[key]) : v }))
  return [state[key], set] as const
}

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
            custom: hypno.textCustomMaster,
          }[hypno.textType],
          hands: {
            off: 'hands',
            joi: 'hands',
            breeding: 'hands',
            maledom: 'paws',
            femdom: 'paws',
            custom: hypno.textCustomHands,
          }[hypno.textType],
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
