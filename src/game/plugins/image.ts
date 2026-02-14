import { pluginPaths, type Plugin } from '../../engine/plugins/Plugins';
import { Pipe, PipeTransformer } from '../../engine/State';
import { Composer } from '../../engine';
import { Events, getEventKey } from '../../engine/pipes/Events';
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

type ImageContext = {
  pushNextImage: PipeTransformer<[ImageItem]>;
  setCurrentImage: PipeTransformer<[ImageItem | undefined]>;
  setNextImages: PipeTransformer<[ImageItem[]]>;
};

const image = pluginPaths<ImageState, ImageContext>(PLUGIN_ID);

const eventType = {
  pushNext: getEventKey(PLUGIN_ID, 'pushNext'),
  setImage: getEventKey(PLUGIN_ID, 'setImage'),
  setNextImages: getEventKey(PLUGIN_ID, 'setNextImages'),
};

export default class Image {
  static pushNextImage(img: ImageItem): Pipe {
    return Composer.call(image.context.pushNextImage, img);
  }

  static setCurrentImage(img: ImageItem | undefined): Pipe {
    return Composer.call(image.context.setCurrentImage, img);
  }

  static setNextImages(imgs: ImageItem[]): Pipe {
    return Composer.call(image.context.setNextImages, imgs);
  }

  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Image',
    },

    activate: Composer.pipe(
      Composer.set(image.state, {
        currentImage: undefined,
        seenImages: [],
        nextImages: [],
      }),
      Composer.set(image.context, {
        pushNextImage: (img: ImageItem) =>
          Events.dispatch({ type: eventType.pushNext, payload: img }),
        setCurrentImage: (img: ImageItem | undefined) =>
          Events.dispatch({ type: eventType.setImage, payload: img }),
        setNextImages: (imgs: ImageItem[]) =>
          Events.dispatch({ type: eventType.setNextImages, payload: imgs }),
      })
    ),

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

    deactivate: Composer.pipe(
      Composer.set(image.state, undefined),
      Composer.set(image.context, undefined)
    ),
  };

  static get paths() {
    return image;
  }
}
