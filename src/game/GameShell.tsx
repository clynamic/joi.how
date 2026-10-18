import { useMemo, ReactNode } from 'react';
import { GameEngineProvider } from './GameProvider';
import { Pipe } from '../engine/State';
import { moduleManagerPipe } from '../engine/modules/ModuleManager';
import { registerPlugins } from './plugins';

type Props = {
  children: ReactNode;
  pipes?: Pipe[];
};

export const GameShell = ({ children, pipes: extra = [] }: Props) => {
  const pipes = useMemo(
    () => [moduleManagerPipe, registerPlugins, ...extra],
    [extra]
  );

  return <GameEngineProvider pipes={pipes}>{children}</GameEngineProvider>;
};
