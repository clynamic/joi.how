import { useMemo, ReactNode } from 'react';
import { GameEngineProvider } from './GameProvider';
import { useSettingsPipe } from './pipes';
import { moduleManagerPipe } from '../engine/modules/ModuleManager';
import { registerPlugins } from './plugins';

type Props = {
  children: ReactNode;
};

export const GameShell = ({ children }: Props) => {
  const settingsPipe = useSettingsPipe();
  const pipes = useMemo(
    () => [moduleManagerPipe, registerPlugins, settingsPipe],
    [settingsPipe]
  );

  return <GameEngineProvider pipes={pipes}>{children}</GameEngineProvider>;
};
