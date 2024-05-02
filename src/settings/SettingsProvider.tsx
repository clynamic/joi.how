import { GameEvent, GameHypnoType, PlayerBody, PlayerGender } from '../types';
import { createLocalStorageProvider } from '../utils';

export interface Settings {
  gameDuration: number;
  warmupDuration: number;
  climaxChance: number;
  ruinChance: number;
  minPace: number;
  maxPace: number;
  steepness: number;
  events: GameEvent[];
  hypno: GameHypnoType;
  gender: PlayerGender;
  body: PlayerBody;
}

export const defaultSettings: Settings = {
  gameDuration: 9000,
  warmupDuration: 0,
  climaxChance: 100,
  ruinChance: 0,
  minPace: 0.25,
  maxPace: 5,
  steepness: 0.05,
  events: Object.values(GameEvent),
  hypno: GameHypnoType.joi,
  gender: PlayerGender.man,
  body: PlayerBody.penis,
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
