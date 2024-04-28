import { createStateProvider } from '../utils';

export enum Paws {
  left = 'left',
  right = 'right',
  both = 'both',
  none = 'none',
}

export enum Stroke {
  up = 'up',
  down = 'down',
}

export enum GamePhase {
  warmup = 'warmup',
  active = 'active',
  climax = 'climax',
  pause = 'pause',
}

export interface GameState {
  pace: number;
  intensity: number;
  currentImage: number;
  paws: Paws;
  stroke: Stroke;
  phase: GamePhase;
}

export const initialGameState: GameState = {
  pace: 0,
  intensity: 0,
  currentImage: 0,
  paws: Paws.none,
  stroke: Stroke.down,
  phase: GamePhase.active,
};

export const {
  Provider: GameProvider,
  useProvider: useGame,
  useProviderSelector: useGameValue,
} = createStateProvider<GameState>({
  defaultData: initialGameState,
});
