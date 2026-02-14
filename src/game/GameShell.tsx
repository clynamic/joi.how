import { useMemo, ReactNode } from 'react';
import { GameEngineProvider } from './GameProvider';
import { useSettingsPipe } from './pipes';
import { pluginInstallerPipe } from '../engine/plugins/PluginInstaller';
import { pluginManagerPipe } from '../engine/plugins/PluginManager';
import { registerPlugins } from './plugins';

type Props = {
  children: ReactNode;
};

export const GameShell = ({ children }: Props) => {
  const settingsPipe = useSettingsPipe();
  const pipes = useMemo(
    () => [
      pluginManagerPipe,
      pluginInstallerPipe,
      registerPlugins,
      settingsPipe,
    ],
    [settingsPipe]
  );

  return <GameEngineProvider pipes={pipes}>{children}</GameEngineProvider>;
};
