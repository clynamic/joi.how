import { useCallback } from 'react';
import { useKeys } from '../bridge/hooks';
import { playerKeys } from '../../game/player';
import { hypnoKeys } from '../../game/classic/hypno';
import { translateWith } from '../../game/translate';

export const useTranslate = (): ((value: string) => string) => {
  const [{ gender, body }] = useKeys(playerKeys);
  const [{ hypno }] = useKeys(hypnoKeys);

  return useCallback(
    (value: string) => translateWith({ gender, body, hypno }, value),
    [body, gender, hypno]
  );
};
