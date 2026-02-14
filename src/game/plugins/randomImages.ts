import type { Plugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine';
import { Events } from '../../engine/pipes/Events';
import { Scheduler } from '../../engine/pipes/Scheduler';
import { typedPath } from '../../engine/Lens';
import { ImageItem } from '../../types';
import Image, { ImageState } from './image';
import { IntensityState } from './intensity';

declare module '../../engine/sdk' {
  interface PluginSDK {
    RandomImages: typeof RandomImages;
  }
}

const PLUGIN_ID = 'core.random_images';

const images = typedPath<ImageItem[]>(['context', 'images']);
const intensityState = typedPath<IntensityState>(['state', 'core.intensity']);
const imageState = typedPath<ImageState>(['state', 'core.images']);

const eventType = Events.getKeys(PLUGIN_ID, 'schedule_next');

const scheduleId = Scheduler.getKey(PLUGIN_ID, 'randomImageSwitch');

const getImageSwitchDuration = (intensity: number): number => {
  return Math.max((100 - intensity * 100) * 80, 2000);
};

export default class RandomImages {
  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'RandomImages',
    },

    activate: Composer.do(({ get, pipe }) => {
      const imgs = get(images);
      if (!imgs || imgs.length === 0) return;

      const shuffled = [...imgs].sort(() => Math.random() - 0.5);
      const initial = shuffled.slice(0, Math.min(3, imgs.length));

      for (const img of initial) {
        pipe(Image.pushNextImage(img));
      }
      pipe(Events.dispatch({ type: eventType.scheduleNext }));
    }),

    update: Events.handle(eventType.scheduleNext, () =>
      Composer.do(({ get, pipe }) => {
        const imgs = get(images);
        if (!imgs || imgs.length === 0) return;

        const { seenImages = [] } = get(imageState) ?? {};
        const { intensity = 0 } = get(intensityState) ?? {};

        const imagesWithDistance = imgs.map(image => {
          const seenIndex = seenImages.indexOf(image);
          const distance = seenIndex === -1 ? seenImages.length : seenIndex;
          return { image, distance };
        });

        imagesWithDistance.sort((a, b) => b.distance - a.distance);

        const weights = imagesWithDistance.map((_, index) =>
          Math.max(1, imagesWithDistance.length - index)
        );
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        let random = Math.random() * totalWeight;
        let selectedIndex = 0;
        for (let i = 0; i < weights.length; i++) {
          random -= weights[i];
          if (random <= 0) {
            selectedIndex = i;
            break;
          }
        }

        const randomImage = imagesWithDistance[selectedIndex].image;

        pipe(Image.pushNextImage(randomImage));
        pipe(
          Scheduler.schedule({
            id: scheduleId,
            duration: getImageSwitchDuration(intensity),
            event: { type: eventType.scheduleNext },
          })
        );
      })
    ),
  };
}
