import { describe, it, expect, beforeEach } from 'vitest';
import {
  Plugin,
  INBUILT_PLUGINS,
  pluginManagerPipe,
  activatePlugin,
  deactivatePlugin,
  savePlugin,
  PLUGIN_NAMESPACE,
  PluginManagerState,
} from './Plugins';
import { GameFrame } from '../State';
import { Composer } from '../Composer';

describe('Plugin System', () => {
  beforeEach(() => {
    localStorage.clear();
    INBUILT_PLUGINS.length = 0;
  });

  describe('Plugin Lifecycle', () => {
    it('should activate plugin on first frame', () => {
      let activateCalled = false;
      let updateCalled = false;

      const testPlugin: Plugin = {
        id: 'test.plugin',
        activate: (frame: GameFrame) => {
          activateCalled = true;
          return frame;
        },
        update: (frame: GameFrame) => {
          updateCalled = true;
          return frame;
        },
      };

      INBUILT_PLUGINS.push(testPlugin);

      let frame: GameFrame = {
        state: {},
        context: { tick: 0, deltaTime: 0, elapsedTime: 0 },
      };

      frame = Composer.over<Partial<PluginManagerState>>(
        ['state', PLUGIN_NAMESPACE],
        (plugins = {}) => ({
          active: [],
          inserting: ['test.plugin'],
          removing: [],
          ...plugins,
        })
      )(frame);

      pluginManagerPipe(frame);

      expect(activateCalled).toBe(true);
      expect(updateCalled).toBe(true);
    });

    it('should update active plugin', () => {
      let updateCount = 0;

      const testPlugin: Plugin = {
        id: 'test.plugin',
        update: (frame: GameFrame) => {
          updateCount++;
          return frame;
        },
      };

      INBUILT_PLUGINS.push(testPlugin);

      let frame: GameFrame = {
        state: {},
        context: { tick: 0, deltaTime: 0, elapsedTime: 0 },
      };

      frame = Composer.over<Partial<PluginManagerState>>(
        ['state', PLUGIN_NAMESPACE],
        (plugins = {}) => ({
          active: ['test.plugin'],
          inserting: [],
          removing: [],
          ...plugins,
        })
      )(frame);

      pluginManagerPipe(frame);
      pluginManagerPipe(frame);

      expect(updateCount).toBe(2);
    });

    it('should deactivate plugin', () => {
      let deactivateCalled = false;
      let updateCalled = false;

      const testPlugin: Plugin = {
        id: 'test.plugin',
        update: (frame: GameFrame) => {
          updateCalled = true;
          return frame;
        },
        deactivate: (frame: GameFrame) => {
          deactivateCalled = true;
          return frame;
        },
      };

      INBUILT_PLUGINS.push(testPlugin);

      let frame: GameFrame = {
        state: {},
        context: { tick: 0, deltaTime: 0, elapsedTime: 0 },
      };

      frame = Composer.over<Partial<PluginManagerState>>(
        ['state', PLUGIN_NAMESPACE],
        (plugins = {}) => ({
          active: ['test.plugin'],
          inserting: [],
          removing: ['test.plugin'],
          ...plugins,
        })
      )(frame);

      pluginManagerPipe(frame);

      expect(deactivateCalled).toBe(true);
      expect(updateCalled).toBe(false);
    });

    it('should update state after lifecycle execution', () => {
      const testPlugin: Plugin = {
        id: 'test.plugin',
      };

      INBUILT_PLUGINS.push(testPlugin);

      let frame: GameFrame = {
        state: {},
        context: { tick: 0, deltaTime: 0, elapsedTime: 0 },
      };

      frame = Composer.over<Partial<PluginManagerState>>(
        ['state', PLUGIN_NAMESPACE],
        (plugins = {}) => ({
          active: [],
          inserting: ['test.plugin'],
          removing: [],
          ...plugins,
        })
      )(frame);

      const result = pluginManagerPipe(frame);

      expect(result.state.how.joi.plugins).toEqual({
        active: ['test.plugin'],
        inserting: [],
        removing: [],
      });
    });
  });

  describe('Plugin Registry', () => {
    it('should include inbuilt plugins in registry', () => {
      const testPlugin: Plugin = {
        id: 'test.inbuilt',
      };

      INBUILT_PLUGINS.push(testPlugin);

      const frame: GameFrame = {
        state: {},
        context: { tick: 0, deltaTime: 0, elapsedTime: 0 },
      };

      const result = pluginManagerPipe(frame);

      const registry = result.context.how?.joi?.plugins?.registry;
      expect(registry['test.inbuilt']).toEqual(testPlugin);
    });
  });

  describe('activatePlugin / deactivatePlugin', () => {
    it('should add plugin to inserting list', () => {
      let frame: GameFrame = {
        state: {},
        context: { tick: 0, deltaTime: 0, elapsedTime: 0 },
      };

      frame = Composer.over<Partial<PluginManagerState>>(
        ['state', PLUGIN_NAMESPACE],
        (plugins = {}) => ({
          active: [],
          inserting: [],
          removing: [],
          ...plugins,
        })
      )(frame);

      const result = activatePlugin('test.plugin')(frame);

      expect(result.state.how.joi.plugins.inserting).toContain('test.plugin');
    });

    it('should add plugin to removing list', () => {
      let frame: GameFrame = {
        state: {},
        context: { tick: 0, deltaTime: 0, elapsedTime: 0 },
      };

      frame = Composer.over<Partial<PluginManagerState>>(
        ['state', PLUGIN_NAMESPACE],
        (plugins = {}) => ({
          active: ['test.plugin'],
          inserting: [],
          removing: [],
          ...plugins,
        })
      )(frame);

      const result = deactivatePlugin('test.plugin')(frame);

      expect(result.state.how.joi.plugins.removing).toContain('test.plugin');
    });
  });

  describe('savePlugin', () => {
    it('should save plugin code to storage', () => {
      const code = 'export default { id: "test" }';
      const frame: GameFrame = {
        state: {},
        context: {
          tick: 0,
          deltaTime: 0,
          elapsedTime: 0,
        },
      };

      savePlugin('test.plugin', code)(frame);

      const stored = localStorage.getItem('how.joi.plugin.code/test.plugin');
      expect(stored).toBe(JSON.stringify(code));
    });
  });

  describe('Plugin Loading', () => {
    it('should start loading user plugins from storage', () => {
      const pluginCode = `
        export default {
          id: 'user.plugin',
          meta: { name: 'User Plugin' }
        };
      `;

      localStorage.setItem(
        'how.joi.plugins.user',
        JSON.stringify(['user.plugin'])
      );
      localStorage.setItem(
        'how.joi.plugin.code/user.plugin',
        JSON.stringify(pluginCode)
      );

      const frame: GameFrame = {
        state: {},
        context: {
          tick: 0,
          deltaTime: 0,
          elapsedTime: 0,
        },
      };

      const result = pluginManagerPipe(frame);

      const pluginContext = result.context.how?.joi?.plugins;
      expect(pluginContext.pending.has('user.plugin')).toBe(true);
    });
  });
});
