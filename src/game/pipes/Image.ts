import { Composer } from '../../engine';
import { GameFrame, Pipe, PipeTransformer } from '../../engine/State';
import { ImageItem } from '../../types';
import { EventContext, getEventKey } from '../../engine/pipes/Events';
import { SchedulerContext } from '../../engine/pipes/Scheduler';

const PLUGIN_NAMESPACE = 'core.images';

export type ImageState = {
  currentImage?: ImageItem;
  seenImages: ImageItem[];
  nextImages: ImageItem[];
};

export type ImageContext = {
  switchImage: PipeTransformer<[]>;
  setCurrentImage: PipeTransformer<[ImageItem | undefined]>;
  getCurrentImage: PipeTransformer<
    [(currentImage: ImageItem | undefined) => Pipe]
  >;
};

const getImageSwitchDuration = (intensity: number): number => {
  return Math.max((100 - intensity * 100) * 80, 2000);
};

export const imagePipe: Pipe = Composer.chain(c => {
  const { dispatch, handle } = c.get<EventContext>(['context', 'core.events']);
  const { schedule } = c.get<SchedulerContext>(['context', 'core.scheduler']);

  return c
    .bind<ImageItem[]>(['context', 'images'], images =>
      Composer.bind<ImageState>(
        ['state', PLUGIN_NAMESPACE],
        (state = { seenImages: [], nextImages: [] }) =>
          Composer.when<GameFrame>(
            !state.currentImage && images.length > 0,
            c => {
              const shuffled = [...images].sort(() => Math.random() - 0.5);
              return c.pipe(
                Composer.over<ImageState>(['state', PLUGIN_NAMESPACE], () => ({
                  ...state,
                  currentImage: shuffled[0],
                  nextImages: shuffled.slice(1, 4),
                })),
                dispatch({
                  type: getEventKey(PLUGIN_NAMESPACE, 'scheduleNext'),
                  payload: undefined,
                })
              );
            }
          )
      )
    )

    .set<ImageContext>(['context', PLUGIN_NAMESPACE], {
      switchImage: () =>
        Composer.pipe(
          dispatch({
            type: getEventKey(PLUGIN_NAMESPACE, 'switch'),
            payload: undefined,
          })
        ),

      setCurrentImage: image =>
        Composer.pipe(
          dispatch({
            type: getEventKey(PLUGIN_NAMESPACE, 'setImage'),
            payload: image,
          })
        ),

      getCurrentImage: fn =>
        Composer.bind(['state', PLUGIN_NAMESPACE, 'currentImage'], fn),
    })

    .pipe(
      handle(getEventKey(PLUGIN_NAMESPACE, 'scheduleNext'), () =>
        Composer.bind<number>(
          ['state', 'core.intensity', 'intensity'],
          (intensity = 0) => {
            const duration = getImageSwitchDuration(intensity);
            return Composer.pipe(
              schedule({
                id: 'scheduleNext',
                duration,
                event: {
                  type: getEventKey(PLUGIN_NAMESPACE, 'scheduleNext'),
                  payload: undefined,
                },
              }),
              dispatch({
                type: getEventKey(PLUGIN_NAMESPACE, 'switch'),
              })
            );
          }
        )
      )
    )

    .pipe(
      handle(getEventKey(PLUGIN_NAMESPACE, 'switch'), () =>
        Composer.bind<ImageItem[]>(['context', 'images'], images =>
          Composer.over<ImageState>(
            ['state', PLUGIN_NAMESPACE],
            ({ currentImage, seenImages = [], nextImages = [] }) => {
              if (images.length === 0) {
                return { currentImage: undefined, seenImages, nextImages };
              }

              let next = [...nextImages];
              if (next.length <= 0) {
                next = [...images].sort(() => Math.random() - 0.5).slice(0, 3);
              }

              const seen = [
                ...seenImages,
                ...(currentImage ? [currentImage] : []),
              ];
              if (seen.length > images.length / 2) {
                seen.shift();
              }

              const unseen = images.filter((i: ImageItem) => !seen.includes(i));
              const newCurrent = next.shift();

              if (unseen.length > 0) {
                next.push(unseen[Math.floor(Math.random() * unseen.length)]);
              }

              return {
                currentImage: newCurrent,
                seenImages: seen,
                nextImages: next,
              };
            }
          )
        )
      )
    )

    .pipe(
      handle(getEventKey(PLUGIN_NAMESPACE, 'setImage'), event =>
        Composer.over<ImageState>(['state', PLUGIN_NAMESPACE], state => ({
          ...state,
          currentImage: event.payload,
        }))
      )
    );
});
