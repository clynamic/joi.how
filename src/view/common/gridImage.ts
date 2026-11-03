import { AssetEntry, AssetKey, AssetRecord } from '../../game/assets';

export type GridImage = {
  key: AssetKey;
  record: AssetRecord;
  urls: AssetEntry['urls'];
};
