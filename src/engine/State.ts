export type GameState = {
  [key: string]: any;
};

export type GameContext = {
  [key: string]: any;
} & GameTiming;

export type GameTiming = {
  tick: number;
  deltaTime: number;
  elapsedTime: number;
};

export type GameFrame = {
  state: GameState;
  context: GameContext;
};

export type Pipe = (value: GameFrame) => GameFrame;

export type PipeTransformer<TArgs extends any[]> = (...args: TArgs) => Pipe;
