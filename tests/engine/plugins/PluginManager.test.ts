import { describe, it, expect, beforeEach } from 'vitest';
import { Plugin, PluginClass, EnabledMap } from '../../../src/engine/plugins/Plugins';
import { PluginManager, pluginManagerPipe } from '../../../src/engine/plugins/PluginManager';
import { Events } from '../../../src/engine/pipes/Events';
import { Composer } from '../../../src/engine/Composer';
import { Pipe, GameFrame } from '../../../src/engine/State';
import { makeFrame, tick } from '../../utils';

const PLUGIN_NAMESPACE = 'core.plugin_manager';

const gamePipe: Pipe = Composer.pipe(Events.pipe, pluginManagerPipe);

const getLoadedIds = (frame: GameFrame): string[] =>
  (frame.state as any)?.core?.plugin_manager?.loaded ?? [];

const getLoadedRefs = (frame: GameFrame): Record<string, Plugin> =>
  (frame.context as any)?.core?.plugin_manager?.loadedRefs ?? {};

const makePluginClass = (plugin: Plugin): PluginClass => ({
  plugin,
  name: plugin.id,
});

function bootstrap(plugin: Plugin): GameFrame {
  const frame0 = gamePipe(makeFrame());
  const frame1 = PluginManager.register(makePluginClass(plugin))(frame0);
  return gamePipe(tick(frame1));
}

describe('Plugin System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Registration + auto-enable', () => {
    it('should activate a registered plugin after event cycle', () => {
      let activateCalled = false;
      let updateCalled = false;

      bootstrap({
        id: 'test.plugin',
        activate: (frame: GameFrame) => {
          activateCalled = true;
          return frame;
        },
        update: (frame: GameFrame) => {
          updateCalled = true;
          return frame;
        },
      });

      expect(activateCalled).toBe(true);
      expect(updateCalled).toBe(true);
    });

    it('should auto-enable registered plugins in Storage', () => {
      bootstrap({ id: 'test.plugin' });

      const stored: EnabledMap = JSON.parse(
        localStorage.getItem(`${PLUGIN_NAMESPACE}.enabled`)!
      );
      expect(stored['test.plugin']).toBe(true);
    });

    it('should track loaded plugin in state', () => {
      const result = bootstrap({ id: 'test.plugin' });
      expect(getLoadedIds(result)).toContain('test.plugin');
    });

    it('should store plugin ref in context', () => {
      const result = bootstrap({ id: 'test.plugin' });
      expect(getLoadedRefs(result)).toHaveProperty('test.plugin');
    });
  });

  describe('Lifecycle', () => {
    it('should update active plugin on subsequent frames', () => {
      let updateCount = 0;

      const frame1 = bootstrap({
        id: 'test.plugin',
        update: (frame: GameFrame) => {
          updateCount++;
          return frame;
        },
      });
      expect(updateCount).toBe(1);

      gamePipe(tick(frame1));
      expect(updateCount).toBe(2);
    });

    it('should deactivate plugin when disabled', () => {
      let deactivateCalled = false;

      const frame1 = bootstrap({
        id: 'test.plugin',
        deactivate: (frame: GameFrame) => {
          deactivateCalled = true;
          return frame;
        },
      });
      expect(getLoadedIds(frame1)).toContain('test.plugin');

      const frame2 = PluginManager.disable('test.plugin')(frame1);
      const frame3 = gamePipe(tick(frame2));

      expect(deactivateCalled).toBe(true);
      expect(getLoadedIds(frame3)).not.toContain('test.plugin');
    });

    it('should re-enable a disabled plugin', () => {
      let activateCount = 0;

      const frame1 = bootstrap({
        id: 'test.plugin',
        activate: (frame: GameFrame) => {
          activateCount++;
          return frame;
        },
      });
      expect(activateCount).toBe(1);

      const frame2 = PluginManager.disable('test.plugin')(frame1);
      const frame3 = gamePipe(tick(frame2));

      const frame4 = PluginManager.enable('test.plugin')(frame3);
      gamePipe(tick(tick(frame4)));

      expect(activateCount).toBe(2);
    });
  });

  describe('Unregister', () => {
    it('should deactivate and remove a plugin from registry', () => {
      let deactivateCalled = false;

      const frame1 = bootstrap({
        id: 'test.plugin',
        deactivate: (frame: GameFrame) => {
          deactivateCalled = true;
          return frame;
        },
      });
      expect(getLoadedIds(frame1)).toContain('test.plugin');

      const frame2 = PluginManager.unregister('test.plugin')(frame1);
      const frame3 = gamePipe(tick(frame2));

      expect(deactivateCalled).toBe(true);
      expect(getLoadedIds(frame3)).not.toContain('test.plugin');
    });

    it('should not re-activate after unregister', () => {
      let activateCount = 0;

      const frame1 = bootstrap({
        id: 'test.plugin',
        activate: (frame: GameFrame) => {
          activateCount++;
          return frame;
        },
      });
      expect(activateCount).toBe(1);

      const frame2 = PluginManager.unregister('test.plugin')(frame1);
      const frame3 = gamePipe(tick(frame2));

      gamePipe(tick(tick(frame3)));
      expect(activateCount).toBe(1);
    });
  });

  describe('Disabled plugin persistence', () => {
    it('should not activate a disabled plugin on restart', () => {
      localStorage.setItem(
        `${PLUGIN_NAMESPACE}.enabled`,
        JSON.stringify({ 'test.plugin': false })
      );

      const result = bootstrap({ id: 'test.plugin' });
      expect(getLoadedIds(result)).not.toContain('test.plugin');
    });
  });

  describe('PluginManager.enable / PluginManager.disable', () => {
    it('should persist enabled state to Storage', () => {
      const frame0 = gamePipe(makeFrame());
      const frame1 = PluginManager.enable('test.plugin')(frame0);
      gamePipe(tick(frame1));

      const stored: EnabledMap = JSON.parse(
        localStorage.getItem(`${PLUGIN_NAMESPACE}.enabled`)!
      );
      expect(stored['test.plugin']).toBe(true);
    });

    it('should persist disabled state to Storage', () => {
      localStorage.setItem(
        `${PLUGIN_NAMESPACE}.enabled`,
        JSON.stringify({ 'test.plugin': true })
      );

      const frame0 = gamePipe(makeFrame());
      const frame1 = PluginManager.disable('test.plugin')(frame0);
      gamePipe(tick(frame1));

      const stored: EnabledMap = JSON.parse(
        localStorage.getItem(`${PLUGIN_NAMESPACE}.enabled`)!
      );
      expect(stored['test.plugin']).toBe(false);
    });
  });
});
