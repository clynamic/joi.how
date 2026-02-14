import { useContextSelector } from 'use-context-selector';
import { lensFromPath, normalizePath, Path } from '../../engine/Lens';
import { GameEngineContext } from '../GameProvider';

export const useGameContext = <T = any,>(path: Path<T>): T => {
  return useContextSelector(GameEngineContext, ctx => {
    if (!ctx?.context) return {} as T;
    const segments = normalizePath(path);
    const effective = segments[0] === 'context' ? segments.slice(1) : segments;
    return lensFromPath<object, T>(effective).get(ctx.context) ?? ({} as T);
  });
};
