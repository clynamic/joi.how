import { Composer } from '../../engine';
import { Pipe, PipeTransformer } from '../../engine/State';
import { ImageItem } from '../../types';
import { EventContext, getEventKey } from '../../engine/pipes/Events';

const PLUGIN_NAMESPACE = 'core.images';

export type ImageState = {
  currentImage?: ImageItem;
  seenImages: ImageItem[];
  nextImages: ImageItem[];
};

export type ImageContext = {
  pushNextImage: PipeTransformer<[ImageItem]>;
  setCurrentImage: PipeTransformer<[ImageItem | undefined]>;
  setNextImages: PipeTransformer<[ImageItem[]]>;
};

export const imagePipe: Pipe = Composer.chain(c => {
  const { dispatch, handle } = c.get<EventContext>(['context', 'core.events']);

  return c
    .set<ImageContext>(['context', PLUGIN_NAMESPACE], {
      pushNextImage: image =>
        Composer.pipe(
          dispatch({
            type: getEventKey(PLUGIN_NAMESPACE, 'pushNext'),
            payload: image,
          })
        ),

      setCurrentImage: image =>
        Composer.pipe(
          dispatch({
            type: getEventKey(PLUGIN_NAMESPACE, 'setImage'),
            payload: image,
          })
        ),

      setNextImages: images =>
        Composer.pipe(
          dispatch({
            type: getEventKey(PLUGIN_NAMESPACE, 'setNextImages'),
            payload: images,
          })
        ),
    })

    .pipe(
      handle(getEventKey(PLUGIN_NAMESPACE, 'pushNext'), event =>
        Composer.over<ImageState>(
          ['state', PLUGIN_NAMESPACE],
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
      )
    )

    .pipe(
      handle(getEventKey(PLUGIN_NAMESPACE, 'setNextImages'), event =>
        Composer.over<ImageState>(['state', PLUGIN_NAMESPACE], state => ({
          ...state,
          nextImages: event.payload,
        }))
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
