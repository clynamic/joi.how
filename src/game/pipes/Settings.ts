import { useEffect, useRef } from 'react';
import { useSettings } from '../../settings';
import { Composer, Pipe } from '../../engine';

export const useSettingsPipe = (): Pipe => {
  const [settings] = useSettings();
  const ref = useRef(settings);

  useEffect(() => {
    if (ref.current !== settings) {
      ref.current = settings;
    }
  }, [settings]);

  return Composer.set(['context', 'settings'], ref.current);
};
