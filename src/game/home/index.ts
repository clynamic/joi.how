import { definePlugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { GameFrame } from '../../engine/State';
import Scene from '../scene';
import Settings from '../settings';
import Presets from '../presets';

const PLUGIN_ID = 'how.joi.home';

const Home = definePlugin({
  sdk: 'Home',
  id: PLUGIN_ID,
  meta: {
    name: 'Home',
  },

  ordering: {
    loadAfter: [Scene.id, Settings.id, Presets.id],
  },

  keys: Settings.keys(PLUGIN_ID, { ageCheckConfirm: false }),

  update: Scene.whenScene(
    'boot',
    Composer.do<GameFrame>(({ get, pipe }) => {
      if (!get(Settings.paths.loaded) || !get(Presets.paths.loaded)) return;
      pipe(Scene.setScene('home'));
    })
  ),
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Home: typeof Home;
  }
}

export default Home;
