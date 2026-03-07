import { definePlugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine';
import { Events } from '../../engine/pipes/Events';
import { Scheduler } from '../../engine/pipes/Scheduler';
import { typedPath } from '../../engine/Lens';
import { ImageItem } from '../../types';
import Image, { ImageState } from './image';
import { IntensityState } from './intensity';
import Rand from './rand';

const PLUGIN_ID = 'core.random_images';

const images = typedPath<ImageItem[]>(['images']);
const intensityState = typedPath<IntensityState>(['core.intensity']);
const imageState = typedPath<ImageState>(['core.images']);

const eventType = Events.getKeys(PLUGIN_ID, 'schedule_next');

const scheduleId = Scheduler.getKey(PLUGIN_ID, 'randomImageSwitch');

const getImageSwitchDuration = (intensity: number): number => {
  return Math.max((100 - intensity * 100) * 80, 2000);
};

const RandomImages = definePlugin({
  id: PLUGIN_ID,
  meta: {
    name: 'RandomImages',
  },

  activate: Composer.do(({ get, pipe }) => {
    const imgs = get(images);
    if (!imgs || imgs.length === 0) return;

    pipe(
      Rand.shuffle(imgs, shuffled => {
        const initial = shuffled.slice(0, Math.min(3, imgs.length));
        return Composer.pipe(
          ...initial.map(img => Image.pushNextImage(img)),
          Events.dispatch({ type: eventType.scheduleNext })
        );
      })
    );
  }),

  update: Events.handle(eventType.scheduleNext, () =>
    Composer.do(({ get, pipe }) => {
      const imgs = get(images);
      if (!imgs || imgs.length === 0) return;

      const { seenImages = [] } = get(imageState);
      const { intensity = 0 } = get(intensityState);

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

      pipe(
        Rand.next(roll => {
          let remaining = roll * totalWeight;
          let selectedIndex = 0;
          for (let i = 0; i < weights.length; i++) {
            remaining -= weights[i];
            if (remaining <= 0) {
              selectedIndex = i;
              break;
            }
          }

          const randomImage = imagesWithDistance[selectedIndex].image;

          return Composer.pipe(
            Image.pushNextImage(randomImage),
            Scheduler.schedule({
              id: scheduleId,
              duration: getImageSwitchDuration(intensity),
              event: { type: eventType.scheduleNext },
            })
          );
        })
      );
    })
  ),
});

export default RandomImages;
