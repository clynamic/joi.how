import { useContextSelector } from 'use-context-selector';
import { lensFromPath, normalizePath, Path } from '../../engine/Lens';
import { GameEngineContext } from '../GameProvider';

export const useGameState = <T = any,>(path: Path<T>): T => {
  return useContextSelector(GameEngineContext, ctx => {
    if (!ctx?.state) return {} as T;
    const segments = normalizePath(path);
    const effective = segments[0] === 'state' ? segments.slice(1) : segments;
    return lensFromPath<object, T>(effective).get(ctx.state) ?? ({} as T);
  });
};
