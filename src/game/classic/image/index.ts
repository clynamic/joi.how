import { definePlugin, pluginPaths } from '../../../engine/plugins/Plugins';
import { GameFrame, Pipe } from '../../../engine/State';
import { Composer } from '../../../engine';
import { Events } from '../../../engine/pipes/Events';
import Assets, { AssetKey, AssetSize } from '../../assets';
import Settings from '../../settings';

const PLUGIN_ID = 'how.joi.classic.image';

export type ImageState = {
  currentImage?: AssetKey;
  nextImages: AssetKey[];
};

const image = pluginPaths<ImageState>(PLUGIN_ID);

const eventType = Events.getKeys(
  PLUGIN_ID,
  'push_next',
  'advance',
  'set_image',
  'set_next_images'
);

export const displayKeys = Settings.keys(PLUGIN_ID, {
  highRes: false,
  videoSound: false,
});

const sizesFor = (frame: GameFrame, key: AssetKey): AssetSize[] => {
  const record = Assets.find(frame, {}).find(
    entry => Assets.key(entry.source, entry.id) === key
  )?.record;
  const { highRes } = displayKeys.get(frame);
  const main: AssetSize =
    highRes || record?.kind === 'video' ? 'full' : 'preview';
  return ['thumbnail', 'preview', main];
};

const preload = (key: AssetKey): Pipe =>
  Composer.do<GameFrame>(({ get, pipe }) => {
    pipe(Assets.use([key]));
    for (const size of new Set(sizesFor(get(), key))) {
      pipe(Assets.load(key, size));
    }
  });

const Image = definePlugin({
  sdk: 'Image',
  id: PLUGIN_ID,
  meta: {
    name: 'Image',
  },

  keys: displayKeys,

  preload,

  pushNextImage(key: AssetKey): Pipe {
    return Events.dispatch({ type: eventType.pushNext, payload: key });
  },

  advance(): Pipe {
    return Events.dispatch({ type: eventType.advance });
  },

  setCurrentImage(key: AssetKey | undefined): Pipe {
    return Events.dispatch({ type: eventType.setImage, payload: key });
  },

  setNextImages(keys: AssetKey[]): Pipe {
    return Events.dispatch({ type: eventType.setNextImages, payload: keys });
  },

  activate: Composer.set(image, {
    currentImage: undefined,
    nextImages: [],
  }),

  update: Composer.pipe(
    Events.handle<AssetKey>(eventType.pushNext, event =>
      Composer.pipe(
        Composer.over(image, state => ({
          ...state,
          nextImages: [...(state.nextImages ?? []), event.payload],
        })),
        preload(event.payload)
      )
    ),

    Events.handle(eventType.advance, () =>
      Composer.over(image, state => {
        const [head, ...rest] = state.nextImages ?? [];
        if (head === undefined) return state;
        return { ...state, currentImage: head, nextImages: rest };
      })
    ),

    Events.handle<AssetKey[]>(eventType.setNextImages, event =>
      Composer.pipe(
        Composer.over(image, state => ({
          ...state,
          nextImages: event.payload,
        })),
        ...event.payload.map(preload)
      )
    ),

    Events.handle<AssetKey | undefined>(eventType.setImage, event =>
      Composer.pipe(
        Composer.over(image, state => ({
          ...state,
          currentImage: event.payload,
        })),
        event.payload ? preload(event.payload) : frame => frame
      )
    )
  ),

  deactivate: Composer.set(image, undefined),

  get paths() {
    return image;
  },
});

declare module '../../../engine/sdk' {
  interface PluginSDK {
    Image: typeof Image;
  }
}

export default Image;
