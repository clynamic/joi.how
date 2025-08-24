import { FpsContext } from '../../engine';
import { useGameContext } from '../hooks';

export const FpsDisplay = () => {
  const { history, value } = useGameContext<FpsContext>('core.fps');

  const fps = Math.round(
    history?.length > 0
      ? history.reduce((sum, fps) => sum + fps, 0) / history.length
      : value ?? 0
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        background: 'black',
        color: 'white',
        padding: '4px 8px',
        fontFamily: 'monospace',
      }}
    >
      FPS: {fps || '...'}
    </div>
  );
};
