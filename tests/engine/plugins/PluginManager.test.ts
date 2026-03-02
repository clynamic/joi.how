import { describe, it, expect, beforeEach } from 'vitest';
import {
  Plugin,
  PluginClass,
  EnabledMap,
} from '../../../src/engine/plugins/Plugins';
import {
  PluginManager,
  pluginManagerPipe,
} from '../../../src/engine/plugins/PluginManager';
import { moduleManagerPipe } from '../../../src/engine/modules/ModuleManager';
import { Events } from '../../../src/engine/pipes/Events';
import { Composer } from '../../../src/engine/Composer';
import { Pipe, GameFrame } from '../../../src/engine/State';
import { makeFrame, tick } from '../../utils';

const PLUGIN_NAMESPACE = 'core.plugin_manager';

const gamePipe: Pipe = Composer.pipe(
  Events.pipe,
  moduleManagerPipe,
  pluginManagerPipe
);

const getOrder = (frame: GameFrame): string[] =>
  (frame as any)?.core?.modules?.order ?? [];

const getRegistry = (frame: GameFrame): Record<string, any> =>
  (frame as any)?.core?.modules?.registry ?? {};

const makePluginClass = (plugin: Plugin): PluginClass => ({
  plugin,
  name: plugin.id,
});

function bootstrap(plugin: Plugin): GameFrame {
  const frame0 = gamePipe(makeFrame());
  const frame1 = PluginManager.register(makePluginClass(plugin))(frame0);
  const frame2 = gamePipe(tick(frame1));
  return gamePipe(tick(frame2));
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

    it('should track loaded module in order', () => {
      const result = bootstrap({ id: 'test.plugin' });
      expect(getOrder(result)).toContain('test.plugin');
    });

    it('should store module in registry', () => {
      const result = bootstrap({ id: 'test.plugin' });
      expect(getRegistry(result)).toHaveProperty('test.plugin');
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
      expect(getOrder(frame1)).toContain('test.plugin');

      const frame2 = PluginManager.disable('test.plugin')(frame1);
      const frame3 = gamePipe(tick(frame2));
      const frame4 = gamePipe(tick(frame3));

      expect(deactivateCalled).toBe(true);
      expect(getOrder(frame4)).not.toContain('test.plugin');
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
      const frame4 = gamePipe(tick(frame3));

      const frame5 = PluginManager.enable('test.plugin')(frame4);
      const frame6 = gamePipe(tick(frame5));
      gamePipe(tick(frame6));

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
      expect(getOrder(frame1)).toContain('test.plugin');

      const frame2 = PluginManager.unregister('test.plugin')(frame1);
      const frame3 = gamePipe(tick(frame2));
      const frame4 = gamePipe(tick(frame3));

      expect(deactivateCalled).toBe(true);
      expect(getOrder(frame4)).not.toContain('test.plugin');
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
      const frame4 = gamePipe(tick(frame3));

      gamePipe(tick(tick(frame4)));
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
      expect(getOrder(result)).not.toContain('test.plugin');
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
