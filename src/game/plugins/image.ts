import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { Composer } from '../../engine';
import { Events } from '../../engine/pipes/Events';
import { ImageItem } from '../../types';

const PLUGIN_ID = 'core.images';

export type ImageState = {
  currentImage?: ImageItem;
  nextImages: ImageItem[];
};

const image = pluginPaths<ImageState>(PLUGIN_ID);

const eventType = Events.getKeys(
  PLUGIN_ID,
  'push_next',
  'advance',
  'set_image',
  'set_next_images'
);

const Image = definePlugin({
  sdk: 'Image',
  id: PLUGIN_ID,
  meta: {
    name: 'Image',
  },

  pushNextImage(img: ImageItem): Pipe {
    return Events.dispatch({ type: eventType.pushNext, payload: img });
  },

  advance(): Pipe {
    return Events.dispatch({ type: eventType.advance });
  },

  setCurrentImage(img: ImageItem | undefined): Pipe {
    return Events.dispatch({ type: eventType.setImage, payload: img });
  },

  setNextImages(imgs: ImageItem[]): Pipe {
    return Events.dispatch({ type: eventType.setNextImages, payload: imgs });
  },

  activate: Composer.set(image, {
    currentImage: undefined,
    nextImages: [],
  }),

  update: Composer.pipe(
    Events.handle<ImageItem>(eventType.pushNext, event =>
      Composer.over(image, state => ({
        ...state,
        nextImages: [...(state.nextImages ?? []), event.payload],
      }))
    ),

    Events.handle(eventType.advance, () =>
      Composer.over(image, state => {
        const [head, ...rest] = state.nextImages ?? [];
        if (head === undefined) return state;
        return { ...state, currentImage: head, nextImages: rest };
      })
    ),

    Events.handle<ImageItem[]>(eventType.setNextImages, event =>
      Composer.over(image, state => ({
        ...state,
        nextImages: event.payload,
      }))
    ),

    Events.handle<ImageItem | undefined>(eventType.setImage, event =>
      Composer.over(image, state => ({
        ...state,
        currentImage: event.payload,
      }))
    )
  ),

  deactivate: Composer.set(image, undefined),

  get paths() {
    return image;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Image: typeof Image;
  }
}

export default Image;
