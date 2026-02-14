import { useCallback, useRef } from 'react';
import { useSettings, useImages } from '../../settings';
import { Composer, Pipe } from '../../engine';

export const useSettingsPipe = (): Pipe => {
  const [settings] = useSettings();
  const [images] = useImages();
  const settingsRef = useRef(settings);
  const imagesRef = useRef(images);

  settingsRef.current = settings;
  imagesRef.current = images;

  return useCallback<Pipe>(
    frame =>
      Composer.pipe(
        Composer.set(['context', 'settings'], settingsRef.current),
        Composer.set(['context', 'images'], imagesRef.current)
      )(frame),
    []
  );
};
