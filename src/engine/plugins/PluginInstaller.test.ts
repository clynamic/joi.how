import { describe, it, expect, beforeEach } from 'vitest';
import { pluginInstallerPipe } from './PluginInstaller';
import { GameFrame } from '../State';

const PLUGIN_NAMESPACE = 'core.plugin_installer';

const makeFrame = (overrides?: Partial<GameFrame>): GameFrame => ({
  state: {},
  context: { tick: 0, deltaTime: 16, elapsedTime: 0 },
  ...overrides,
});

describe('Plugin Installer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('User Plugin Loading', () => {
    it('should start loading user plugins from storage', () => {
      const pluginCode = `export default { id: 'user.plugin' };`;

      localStorage.setItem(
        `${PLUGIN_NAMESPACE}.user`,
        JSON.stringify(['user.plugin'])
      );
      localStorage.setItem(
        `${PLUGIN_NAMESPACE}.code/user.plugin`,
        JSON.stringify(pluginCode)
      );

      const result = pluginInstallerPipe(makeFrame());

      const installerContext = (result.context as any).core?.plugin_installer;
      expect(installerContext.pending.has('user.plugin')).toBe(true);
    });
  });
});
