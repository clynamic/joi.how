import { useGameEngine } from '../GameProvider';

export const FpsDisplay = () => {
  const { context } = useGameEngine();

  const fps = context?.core?.fps ? Math.round(context.core.fps) : null;

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
