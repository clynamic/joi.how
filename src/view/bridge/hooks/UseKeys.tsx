import { useCallback, useMemo } from 'react';
import { Document, Keys } from '../../../engine/plugins/Documents';
import { useGameFrame } from './UseGameFrame';
import { useDispatchEvent } from './UseDispatchEvent';

export function useKeys<T extends Document>(
  keys: Keys<T>
): [T, <K extends keyof T & string>(key: K, value: T[K]) => void] {
  const document = useGameFrame<Document | undefined>(keys.path);
  const { inject } = useDispatchEvent();
  const values = useMemo(() => keys.from(document), [keys, document]);
  const set = useCallback(
    <K extends keyof T & string>(key: K, value: T[K]) =>
      inject(keys.set(key, value)),
    [inject, keys]
  );
  return [values, set];
}
