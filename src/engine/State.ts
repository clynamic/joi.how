export type GameTiming = {
  tick: number;
  step: number;
  time: number;
};

export type GameFrame = {
  [key: string]: any;
} & GameTiming;

export type Pipe = (value: GameFrame) => GameFrame;

export type PipeTransformer<TArgs extends any[]> = (...args: TArgs) => Pipe;
