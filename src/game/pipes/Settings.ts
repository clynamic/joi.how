import { useEffect, useRef } from 'react';
import { useSettings, useImages } from '../../settings';
import { Composer, Pipe } from '../../engine';

export const useSettingsPipe = (): Pipe => {
  const [settings] = useSettings();
  const [images] = useImages();
  const settingsRef = useRef(settings);
  const imagesRef = useRef(images);

  useEffect(() => {
    if (settingsRef.current !== settings) {
      settingsRef.current = settings;
    }
  }, [settings]);

  useEffect(() => {
    if (imagesRef.current !== images) {
      imagesRef.current = images;
    }
  }, [images]);

  return Composer.pipe(
    Composer.set(['context', 'settings'], settingsRef.current),
    Composer.set(['context', 'images'], imagesRef.current)
  );
};
