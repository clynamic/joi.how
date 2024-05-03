import { Dispatch, SetStateAction } from 'react';
import { createPropertySetter, createStateProvider } from '../utils';

export enum Paws {
  left = 'left',
  right = 'right',
  both = 'both',
  none = 'none',
}

export const PawLabels: Record<Paws, string> = {
  [Paws.left]: 'Left',
  [Paws.right]: 'Right',
  [Paws.both]: 'Both',
  [Paws.none]: 'Off',
};

export enum Stroke {
  up = 'up',
  down = 'down',
}

export enum GamePhase {
  pause = 'pause',
  warmup = 'warmup',
  active = 'active',
  finale = 'finale',
  climax = 'climax',
}

export interface GameMessagePrompt {
  title: string;
  onClick: () => void | Promise<void>;
}

export interface GameMessage {
  id: string;
  title: string;
  description?: string;
  prompts?: GameMessagePrompt[];
  duration?: number;
}

export interface GameState {
  pace: number;
  intensity: number;
  currentImage: number;
  paws: Paws;
  stroke: Stroke;
  phase: GamePhase;
  edged: boolean;
  messages: GameMessage[];
}

export const initialGameState: GameState = {
  pace: 0,
  intensity: 0,
  currentImage: 0,
  paws: Paws.none,
  stroke: Stroke.down,
  phase: GamePhase.active,
  edged: false,
  messages: [],
};

export const {
  Provider: GameProvider,
  useProvider: useGame,
  useProviderSelector: useGameValue,
} = createStateProvider<GameState>({
  defaultData: initialGameState,
});

export const createSendMessage = (
  setGame: Dispatch<SetStateAction<GameState>>
) => {
  const setMessages = createPropertySetter(setGame, 'messages');
  return (message: Partial<GameMessage> & { id: string }) => {
    setMessages(messages => {
      const previous = messages.find(m => m.id === message.id);
      return [
        ...messages.filter(m => m.id !== message.id),
        {
          ...previous,
          ...message,
        } as GameMessage,
      ];
    });
  };
};
