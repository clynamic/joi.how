import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { Composer } from '../../engine';
import { Events } from '../../engine/pipes/Events';
import { ImageItem } from '../../types';

const PLUGIN_ID = 'core.images';

export type ImageState = {
  currentImage?: ImageItem;
  seenImages: string[];
  nextImages: ImageItem[];
};

const image = pluginPaths<ImageState>(PLUGIN_ID);

const eventType = Events.getKeys(
  PLUGIN_ID,
  'push_next',
  'set_image',
  'set_next_images'
);

const Image = definePlugin({
  name: 'Image',
  id: PLUGIN_ID,
  meta: {
    name: 'Image',
  },

  pushNextImage(img: ImageItem): Pipe {
    return Events.dispatch({ type: eventType.pushNext, payload: img });
  },

  setCurrentImage(img: ImageItem | undefined): Pipe {
    return Events.dispatch({ type: eventType.setImage, payload: img });
  },

  setNextImages(imgs: ImageItem[]): Pipe {
    return Events.dispatch({ type: eventType.setNextImages, payload: imgs });
  },

  activate: Composer.set(image, {
    currentImage: undefined,
    seenImages: [],
    nextImages: [],
  }),

  update: Composer.pipe(
    Events.handle<ImageItem>(eventType.pushNext, event =>
      Composer.over(
        image,
        ({ currentImage, seenImages = [], nextImages = [] }) => {
          const newImage = event.payload;
          const next = [...nextImages];
          const seen = [...seenImages];

          if (currentImage) {
            const existingIndex = seen.indexOf(currentImage.id);
            if (existingIndex !== -1) {
              seen.splice(existingIndex, 1);
            }
            seen.unshift(currentImage.id);
          }

          if (seen.length > 500) {
            seen.pop();
          }

          next.push(newImage);
          const newCurrent = next.shift();

          return {
            currentImage: newCurrent,
            seenImages: seen,
            nextImages: next,
          };
        }
      )
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
