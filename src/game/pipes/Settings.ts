import { useCallback, useRef } from 'react';
import { useSettings, useImages } from '../../settings';
import { normalizeSettings } from '../../settings/Settings';
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
        Composer.set(['settings'], normalizeSettings(settingsRef.current)),
        Composer.set(['images'], imagesRef.current)
      )(frame),
    []
  );
};
