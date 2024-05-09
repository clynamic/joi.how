import { useState, useCallback, useEffect } from 'react';

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isFullscreen) {
      document.documentElement.requestFullscreen().catch(e => {
        console.error(
          `Error attempting to enable full-screen mode: ${e.message} (${e.name})`
        );
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(document.fullscreenElement === document.documentElement);
  }, []);

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('fullscreenerror', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('fullscreenerror', handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  return [isFullscreen, setIsFullscreen] as const;
};
