import { definePlugin } from '../../engine/plugins/Plugins';

import Settings from '../settings';

export enum PlayerGender {
  male = 'male',
  female = 'female',
  other = 'other',
}

export const PlayerGenderLabels: Record<PlayerGender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

export const PlayerGenderDescriptions: Record<PlayerGender, string> = {
  male: 'Refer to you as male (he/him/boy)',
  female: 'Refer to you as female (she/her/girl)',
  other: 'Refer to you neutrally (they/them/pup)',
};

export enum PlayerBody {
  penis = 'penis',
  vagina = 'vagina',
  neuter = 'neuter',
}

export const PlayerBodyLabels: Record<PlayerBody, string> = {
  penis: 'Cock',
  vagina: 'Pussy',
  neuter: 'Neuter',
};

export const PlayerBodyDescriptions: Record<PlayerBody, string> = {
  penis: 'You have a cock',
  vagina: 'You have a pussy',
  neuter: 'You have neither',
};

const PLUGIN_ID = 'how.joi.player';

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
