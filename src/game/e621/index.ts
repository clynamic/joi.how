import { definePlugin } from '../../engine/plugins/Plugins';
import { Requests } from '../../engine/pipes/Requests';
import { ImageItem, ImageType } from '../assets';
import { E621Credentials, E621Service, E621SortOrder } from './client';
import Assets, { AssetKind, AssetRecord, AssetSize } from '../assets';

const PLUGIN_ID = 'how.joi.e621';

export const SOURCE = PLUGIN_ID;

export type E621SearchPayload = {
  tags: string;
  limit?: number;
  order?: E621SortOrder;
  minScore?: number;
  credentials?: E621Credentials;
  blacklist?: string[];
  holder?: string;
};

export type E621Item = { id: string; record: AssetRecord };

const source = Assets.source(SOURCE);

const service = new E621Service();

const kindOf = (type: ImageType): AssetKind =>
  type === ImageType.video ? 'video' : type === ImageType.gif ? 'gif' : 'image';

export const e621Record = (item: ImageItem): AssetRecord => ({
  kind: kindOf(item.type),
  sizes: ['thumbnail', 'preview', 'full'],
  meta: {
    source: item.source,
    urls: { thumbnail: item.thumbnail, preview: item.preview, full: item.full },
  },
});

const urlOf = (record: AssetRecord, size: AssetSize): string => {
  const urls = (record.meta?.urls ?? {}) as Partial<Record<AssetSize, string>>;
  const url = urls[size] ?? urls.full;
  if (!url) throw new Error(`no ${size} url on record`);
  return url;
};

const search = Requests.define<E621SearchPayload, E621Item[]>(
  PLUGIN_ID,
  'search'
);

const E621 = definePlugin({
  sdk: 'E621',
  id: PLUGIN_ID,
  meta: {
    name: 'e621',
  },

  source: SOURCE,

  search: (payload: E621SearchPayload) => search.start(payload),

  onResults: search.onDone,

  onSearchFailed: search.onFailed,

  effects: [
    search.perform(async payload => {
      const { tags, limit, order, credentials, blacklist, minScore } = payload;
      const items = await service.getImages({
        tags,
        limit,
        order,
        credentials,
        blacklist,
        score: minScore,
      });
      return items.map(item => ({ id: item.id, record: e621Record(item) }));
    }),
    source.resolve.perform(async ({ record, size }) => urlOf(record, size)),
    source.drop.perform(() => undefined),
    source.free.perform(() => undefined),
  ],
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    E621: typeof E621;
  }
}

export default E621;
