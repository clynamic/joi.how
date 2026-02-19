import { useContextSelector } from 'use-context-selector';
import { lensFromPath, normalizePath, Path } from '../../engine/Lens';
import { GameEngineContext } from '../GameProvider';

export const useGameFrame = <T = any,>(path: Path<T>): T => {
  return useContextSelector(GameEngineContext, ctx => {
    if (!ctx?.frame) return {} as T;
    const segments = normalizePath(path);
    return lensFromPath<object, T>(segments).get(ctx.frame) ?? ({} as T);
  });
};
