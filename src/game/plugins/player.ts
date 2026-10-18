import { definePlugin } from '../../engine/plugins/Plugins';
import { PlayerBody, PlayerGender } from '../../types';
import Settings from './settings';

const PLUGIN_ID = 'core.player';

export const playerKeys = Settings.keys(PLUGIN_ID, {
  gender: PlayerGender.male as PlayerGender,
  body: PlayerBody.penis as PlayerBody,
});

const Player = definePlugin({
  sdk: 'Player',
  id: PLUGIN_ID,
  meta: {
    name: 'Player',
  },

  keys: playerKeys,
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Player: typeof Player;
  }
}

export default Player;
