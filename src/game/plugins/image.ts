import { pluginPaths, type Plugin } from '../../engine/plugins/Plugins';
import { Pipe } from '../../engine/State';
import { Composer } from '../../engine';
import { Events } from '../../engine/pipes/Events';
import { ImageItem } from '../../types';

declare module '../../engine/sdk' {
  interface PluginSDK {
    Image: typeof Image;
  }
}

const PLUGIN_ID = 'core.images';

export type ImageState = {
  currentImage?: ImageItem;
  seenImages: ImageItem[];
  nextImages: ImageItem[];
};

const image = pluginPaths<ImageState>(PLUGIN_ID);

const eventType = Events.getKeys(PLUGIN_ID, 'push_next', 'set_image', 'set_next_images');

export default class Image {
  static pushNextImage(img: ImageItem): Pipe {
    return Events.dispatch({ type: eventType.pushNext, payload: img });
  }

  static setCurrentImage(img: ImageItem | undefined): Pipe {
    return Events.dispatch({ type: eventType.setImage, payload: img });
  }

  static setNextImages(imgs: ImageItem[]): Pipe {
    return Events.dispatch({ type: eventType.setNextImages, payload: imgs });
  }

  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Image',
    },

    activate: Composer.set(image.state, {
      currentImage: undefined,
      seenImages: [],
      nextImages: [],
    }),

    update: Composer.pipe(
      Events.handle(eventType.pushNext, event =>
        Composer.over(
          image.state,
          ({ currentImage, seenImages = [], nextImages = [] }) => {
            const newImage = event.payload;
            const next = [...nextImages];
            const seen = [...seenImages];

            if (currentImage) {
              const existingIndex = seen.indexOf(currentImage);
              if (existingIndex !== -1) {
                seen.splice(existingIndex, 1);
              }
              seen.unshift(currentImage);
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

      Events.handle(eventType.setNextImages, event =>
        Composer.over(image.state, state => ({
          ...state,
          nextImages: event.payload,
        }))
      ),

      Events.handle(eventType.setImage, event =>
        Composer.over(image.state, state => ({
          ...state,
          currentImage: event.payload,
        }))
      )
    ),

    deactivate: Composer.set(image.state, undefined),
  };

  static get paths() {
    return image;
  }
}
