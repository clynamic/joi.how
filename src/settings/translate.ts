import { useCallback } from 'react';
import { interpolateWith } from '../utils/translate';
import { useKeys } from '../game/hooks';
import { playerKeys } from '../game/plugins/player';
import { hypnoKeys } from '../game/plugins/hypno';

const removeTrailingComma = (str: string): string => {
  return str.trim().replace(/,$/, '');
};

export const useTranslate = (): ((value: string) => string) => {
  const [{ gender, body }] = useKeys(playerKeys);
  const [{ hypno }] = useKeys(hypnoKeys);

  return useCallback(
    (value: string) =>
      removeTrailingComma(
        interpolateWith(value, {
          player: {
            male: 'boy',
            female: 'girl',
            other: 'pup',
          }[gender],
          master: {
            off: '',
            joi: '',
            breeding: '',
            maledom: 'master',
            femdom: 'mistress',
          }[hypno],
          hands: {
            off: 'hands',
            joi: 'hands',
            breeding: 'hands',
            maledom: 'paws',
            femdom: 'paws',
          }[hypno],
          part: {
            penis: 'cock',
            vagina: 'pussy',
            neuter: 'mound',
          }[body],
          stroke: {
            penis: 'stroke',
            vagina: 'paw',
            neuter: 'paw',
          }[body],
        })
      ),
    [body, gender, hypno]
  );
};
