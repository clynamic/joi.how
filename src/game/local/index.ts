import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { Composer } from '../../engine/Composer';
import { GameFrame } from '../../engine/State';
import { Requests } from '../../engine/pipes/Requests';
import { ImageType } from '../assets';
import { LocalImageService, LocalImage, LocalImageRequest } from './images';
import { bytes } from '../bytes/store';
import Assets, { AssetKind, AssetRecord, assetKey } from '../assets';

const PLUGIN_ID = 'how.joi.local';

export const SOURCE = PLUGIN_ID;

export const localImageService = new LocalImageService(bytes.for(PLUGIN_ID));

export type LocalState = {
  importing: { total: number; done: number; error?: 'quota' | 'failed' } | null;
};

const paths = pluginPaths<LocalState>(PLUGIN_ID);

const source = Assets.source(SOURCE);

const check = Requests.define<void, string[]>(PLUGIN_ID, 'check');

const kindOf = (type: ImageType): AssetKind =>
  type === ImageType.video ? 'video' : type === ImageType.gif ? 'gif' : 'image';

const typeOf = (kind: AssetKind): ImageType =>
  kind === 'video'
    ? ImageType.video
    : kind === 'gif'
      ? ImageType.gif
      : ImageType.image;

export const localRecord = (image: LocalImage): AssetRecord => ({
  kind: kindOf(image.type),
  sizes: ['thumbnail', 'preview', 'full'],
  name: image.name,
  meta: { source: `local://full/${image.id}` },
});

const Local = definePlugin({
  sdk: 'Local',
  id: PLUGIN_ID,
  meta: {
    name: 'Local',
  },

  source: SOURCE,

  async import(
    requests: LocalImageRequest[]
  ): Promise<{ id: string; record: AssetRecord }[]> {
    const stored = await localImageService.storeImage(requests);
    return stored.map(image => ({ id: image.id, record: localRecord(image) }));
  },

  importing(progress: LocalState['importing']): Pipe {
    return Composer.set(paths.importing, progress);
  },

  activate: Composer.pipe(
    Composer.set(paths, { importing: null }),
    check.start()
  ),

  update: check.onDone(ids =>
    Composer.do<GameFrame>(({ get, pipe }) => {
      const present = new Set(ids);
      for (const entry of Assets.find(get(), { source: SOURCE })) {
        if (!present.has(entry.id))
          pipe(Assets.forget(assetKey(SOURCE, entry.id)));
      }
    })
  ),

  effects: [
    source.resolve.perform(({ id, record, size }) =>
      localImageService.url(id, size, typeOf(record.kind))
    ),
    source.drop.perform(({ id }) => {
      localImageService.removeImage(id).catch(() => undefined);
    }),
    source.free.perform(({ id }) => localImageService.free(id)),
    check.perform(() => localImageService.listIds()),
  ],

  deactivate: Composer.set(paths, undefined),

  get paths() {
    return paths;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Local: typeof Local;
  }
}

export default Local;
