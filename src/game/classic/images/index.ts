import { definePlugin, pluginPaths } from '../../../engine/plugins/Plugins';
import { Composer } from '../../../engine/Composer';
import { GameFrame, Pipe } from '../../../engine/State';
import Storage from '../../../engine/plugins/Storage';
import { ImageItem, ImageServiceType, ImageType } from '../../assets';
import Assets, { AssetKey, AssetRecord, assetKey } from '../../assets';
import E621, { E621SearchPayload, e621Record } from '../../e621';
import Local from '../../local';
import Presets from '../../presets';

const PLUGIN_ID = 'how.joi.classic.images';

export const HOLDER = PLUGIN_ID;

const LEGACY_KEY = 'images';

export type ClassicImage = { source: string; id: string; record: AssetRecord };

type ClassicImagesState = { used: AssetKey[]; migrated?: boolean };

const paths = pluginPaths<ClassicImagesState>(PLUGIN_ID);

const keys = Presets.keys(PLUGIN_ID, { images: [] as AssetKey[] });

const kindOf = (type: ImageType) =>
  type === ImageType.video ? 'video' : type === ImageType.gif ? 'gif' : 'image';

const legacyItem = (item: ImageItem): ClassicImage =>
  item.service === ImageServiceType.e621
    ? { source: E621.source, id: item.id, record: e621Record(item) }
    : {
        source: Local.source,
        id: item.id,
        record: {
          kind: kindOf(item.type),
          sizes: ['thumbnail', 'preview', 'full'],
          meta: { source: item.source },
        },
      };

const isLegacyList = (value: unknown): value is ImageItem[] =>
  Array.isArray(value) &&
  value.every(
    item =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as ImageItem).id === 'string' &&
      typeof (item as ImageItem).service === 'string'
  );

const add = (items: ClassicImage[]): Pipe =>
  Composer.do<GameFrame>(({ get, pipe }) => {
    if (!get(paths)) return;
    const selection = keys.get(get()).images;
    const added = items.map(item => assetKey(item.source, item.id));
    const next = [
      ...selection,
      ...added.filter(key => !selection.includes(key)),
    ];
    pipe(
      ...items.map(item =>
        Assets.keep(item.source, item.id, item.record, HOLDER)
      ),
      keys.set('images', next),
      Assets.use(added)
    );
  });

const ClassicImages = definePlugin({
  sdk: 'ClassicImages',
  id: PLUGIN_ID,
  meta: {
    name: 'Classic images',
  },

  ordering: {
    loadAfter: [Assets.id, Presets.id],
  },

  keys,

  add,

  remove(removed: AssetKey[]): Pipe {
    return Composer.do<GameFrame>(({ get, pipe }) => {
      if (!get(paths)) return;
      const selection = keys.get(get()).images;
      pipe(
        keys.set(
          'images',
          selection.filter(key => !removed.includes(key))
        ),
        Assets.unuse(removed),
        ...removed.map(key => Assets.release(key, HOLDER))
      );
    });
  },

  searchE621(payload: Omit<E621SearchPayload, 'holder'>): Pipe {
    return E621.search({ ...payload, holder: HOLDER });
  },

  activate: Composer.set(paths, { used: [] }),

  update: Composer.pipe(
    Composer.do<GameFrame>(({ get, set, pipe }) => {
      const state = get(paths);
      if (!state || state.migrated || !get(Presets.paths.loaded)) return;
      set(paths.migrated, true);
      pipe(Storage.read(LEGACY_KEY));
    }),
    Storage.onRead(LEGACY_KEY, value =>
      Composer.do<GameFrame>(({ pipe }) => {
        if (!isLegacyList(value)) return;
        pipe(add(value.map(legacyItem)), Storage.remove(LEGACY_KEY));
      })
    ),
    E621.onResults((items, _id, payload) =>
      payload.holder === HOLDER
        ? add(items.map(item => ({ source: E621.source, ...item })))
        : frame => frame
    ),
    Composer.do<GameFrame>(({ get, set, pipe }) => {
      const state = get(paths);
      if (!state) return;
      const selection = keys.get(get()).images;
      const used = state.used ?? [];
      const gone = used.filter(key => !selection.includes(key));
      const fresh = selection.filter(key => !used.includes(key));
      if (gone.length === 0 && fresh.length === 0) return;
      set(paths.used, selection);
      if (gone.length) pipe(Assets.unuse(gone));
      if (fresh.length) {
        pipe(
          Assets.use(fresh),
          ...fresh.map(key => Assets.load(key, 'thumbnail'))
        );
      }
    })
  ),

  deactivate: Composer.set(paths, undefined),

  get paths() {
    return paths;
  },
});

declare module '../../../engine/sdk' {
  interface PluginSDK {
    ClassicImages: typeof ClassicImages;
  }
}

export default ClassicImages;
