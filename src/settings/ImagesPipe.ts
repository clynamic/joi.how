import { useCallback, useRef } from 'react';
import { useImages } from './ImageProvider';
import { Composer, Pipe } from '../engine';

export const useImagesPipe = (): Pipe => {
  const [images] = useImages();
  const imagesRef = useRef(images);

  imagesRef.current = images;

  return useCallback<Pipe>(
    frame => Composer.set(['images'], imagesRef.current)(frame),
    []
  );
};
