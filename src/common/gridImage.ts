import { AssetEntry, AssetKey, AssetRecord } from '../game/plugins/assets';

export type GridImage = {
  key: AssetKey;
  record: AssetRecord;
  urls: AssetEntry['urls'];
};
