import { Composer } from '../../engine';
import { Pipe } from '../../engine/State';
import { ImageItem } from '../../types';
import { Events, getEventKey } from '../../engine/pipes/Events';
import { getScheduleKey, Scheduler } from '../../engine/pipes/Scheduler';

const PLUGIN_NAMESPACE = 'core.random_images';

const getImageSwitchDuration = (intensity: number): number => {
  return Math.max((100 - intensity * 100) * 80, 2000);
};

export const randomImagesPipe: Pipe = Composer.pipe(
  Composer.bind<boolean>(
    ['state', PLUGIN_NAMESPACE, 'initialized'],
    (initialized = false) =>
      Composer.unless(
        initialized,
        Composer.pipe(
          Composer.set(['state', PLUGIN_NAMESPACE, 'initialized'], true),
          Composer.bind<ImageItem[]>(['context', 'images'], images =>
            Composer.when(
              images.length > 0,
              Composer.chain(c => {
                const shuffled = [...images].sort(() => Math.random() - 0.5);
                const initialImages = shuffled.slice(
                  0,
                  Math.min(3, images.length)
                );

                return c.pipe(
                  ...initialImages.map(image =>
                    Events.dispatch({
                      type: getEventKey('core.images', 'pushNext'),
                      payload: image,
                    })
                  ),
                  Events.dispatch({
                    type: getEventKey(PLUGIN_NAMESPACE, 'scheduleNext'),
                  })
                );
              })
            )
          )
        )
      )
  ),

  Events.handle(getEventKey(PLUGIN_NAMESPACE, 'scheduleNext'), () =>
    Composer.bind<number>(
      ['state', 'core.intensity', 'intensity'],
      (intensity = 0) =>
        Composer.bind<ImageItem[]>(['context', 'images'], images =>
          Composer.bind<ImageItem[]>(
            ['state', 'core.images', 'seenImages'],
            (seenImages = []) =>
              Composer.when(
                images.length > 0,
                Composer.chain(c => {
                  const imagesWithDistance = images.map(image => {
                    const seenIndex = seenImages.indexOf(image);
                    const distance =
                      seenIndex === -1 ? seenImages.length : seenIndex;
                    return { image, distance };
                  });

                  imagesWithDistance.sort((a, b) => b.distance - a.distance);

                  const weights = imagesWithDistance.map((_, index) =>
                    Math.max(1, imagesWithDistance.length - index)
                  );
                  const totalWeight = weights.reduce(
                    (sum, weight) => sum + weight,
                    0
                  );

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

                  return c.pipe(
                    Events.dispatch({
                      type: getEventKey('core.images', 'pushNext'),
                      payload: randomImage,
                    }),
                    Scheduler.schedule({
                      id: getScheduleKey(PLUGIN_NAMESPACE, 'randomImageSwitch'),
                      duration: getImageSwitchDuration(intensity),
                      event: {
                        type: getEventKey(PLUGIN_NAMESPACE, 'scheduleNext'),
                      },
                    })
                  );
                })
              )
          )
        )
    )
  )
);
