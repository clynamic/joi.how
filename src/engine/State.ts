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

export type PipeValue = {
  state: GameState;
  context: GameContext;
};

export type Pipe = (value: PipeValue) => PipeValue;
