import { PlayerBody } from './body';
import { GameEvent } from './event';
import { PlayerGender } from './gender';
import { GameHynpo } from './hypno';

export interface Settings {
  gameDuration: number;
  warmupDuration: number;
  climaxChange: number;
  ruinChange: number;
  minPace: number;
  maxPace: number;
  steepness: number;
  events: GameEvent[];
  hypno: GameHynpo;
  gender: PlayerGender;
  body: PlayerBody;
}

export const defaultSettings: Settings = {
  gameDuration: 9000,
  warmupDuration: 0,
  climaxChange: 100,
  ruinChange: 0,
  minPace: 0.25,
  maxPace: 5,
  steepness: 0.05,
  events: Object.values(GameEvent),
  hypno: GameHynpo.joi,
  gender: PlayerGender.man,
  body: PlayerBody.penis,
};
