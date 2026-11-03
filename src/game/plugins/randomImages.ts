import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine';
import { Events } from '../../engine/pipes/Events';
import { Scheduler } from '../../engine/pipes/Scheduler';
import { typedPath } from '../../engine/Lens';
import { Pipe } from '../../engine/State';
import Presets from './presets';
import { PLAY_TIMELINE } from '../timelines';
import Image from './image';
import ClassicImages from './classicImages';
import { IntensityState } from './intensity';
import Rand from './rand';
import Scene from './scene';

const PLUGIN_ID = 'how.joi.classic.random_images';

type RandomImagesState = {
  seenImages: string[];
};

const state = pluginPaths<RandomImagesState>(PLUGIN_ID);
const intensityState = typedPath<IntensityState>(['how.joi.classic.intensity']);
export const imageKeys = Presets.keys(PLUGIN_ID, {
  imageDuration: 20,
  intenseImages: true,
});

const eventType = Events.getKeys(PLUGIN_ID, 'schedule_next');

const scheduleId = Scheduler.getKey(PLUGIN_ID, 'randomImageSwitch');

export type ImageSwitchSettings = typeof imageKeys.defaults;

export const getImageSwitchDuration = (
  { imageDuration, intenseImages }: ImageSwitchSettings,
  intensity: number
): number => {
  const seconds = Number.isFinite(imageDuration)
    ? imageDuration
    : imageKeys.defaults.imageDuration;
  const level = Number.isFinite(intensity) ? intensity : 0;
  const scale = intenseImages ? Math.max(1 - level, 0.1) : 1;
  return Math.max(seconds * scale * 1000, 1000);
};

const start: Pipe = Composer.do(({ get, pipe }) => {
  const imgs = ClassicImages.keys.get(get()).images;
  if (imgs.length === 0) return;

  pipe(
    Rand.shuffle(imgs, shuffled => {
      const initial = shuffled.slice(0, Math.min(3, imgs.length));
      return Composer.pipe(
        Composer.set(state, { seenImages: initial }),
        ...initial.map(key => Image.pushNextImage(key)),
        Events.dispatch({ type: eventType.scheduleNext })
      );
    })
  );
});

const stop: Pipe = Scheduler.cancel(scheduleId);

const RandomImages = definePlugin({
  id: PLUGIN_ID,
  meta: {
    name: 'RandomImages',
  },

  start: (): Pipe => start,

  stop: (): Pipe => stop,

  activate: Composer.set(state, { seenImages: [] }),

  deactivate: Composer.set(state, undefined),

  update: Composer.pipe(
    Scene.onEnter('game', () => start),
    Scene.onLeave('game', () => stop),
    Events.handle(eventType.scheduleNext, () =>
      Composer.do(({ get, pipe }) => {
        const imgs = ClassicImages.keys.get(get()).images;
        if (imgs.length === 0) return;

        const { seenImages = [] } = get(state);
        const { intensity = 0 } = get(intensityState);
        const s = imageKeys.get(get());

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

            const seen = [...seenImages];
            const existingIndex = seen.indexOf(randomImage);
            if (existingIndex !== -1) {
              seen.splice(existingIndex, 1);
            }
            seen.unshift(randomImage);
            if (seen.length > 500) {
              seen.pop();
            }

            return Composer.pipe(
              Composer.set(state, { seenImages: seen }),
              Image.advance(),
              Image.pushNextImage(randomImage),
              Scheduler.schedule({
                id: scheduleId,
                duration: getImageSwitchDuration(s, intensity),
                timeline: PLAY_TIMELINE,
                event: { type: eventType.scheduleNext },
              })
            );
          })
        );
      })
    )
  ),
});

export default RandomImages;
