import { Dispatch, SetStateAction } from 'react';

export function createPropertySetter<T, K extends keyof T>(
  setter: Dispatch<SetStateAction<T>>,
  key: K
): Dispatch<SetStateAction<T[K]>> {
  return (valueOrUpdater: SetStateAction<T[K]>): void => {
    setter(prevState => {
      const newValue =
        typeof valueOrUpdater === 'function'
          ? (valueOrUpdater as (prevValue: T[K]) => T[K])(prevState[key])
          : valueOrUpdater;

      return { ...prevState, [key]: newValue };
    });
  };
}

export type StateWithSetters<T> = {
  [K in keyof T]: T[K];
} & {
  [K in keyof T as `set${Capitalize<string & K>}`]: Dispatch<
    SetStateAction<T[K]>
  >;
};

export function createStateSetters<T extends object>(
  state: T,
  setState: Dispatch<SetStateAction<T>>
): StateWithSetters<T> {
  const setters = Object.keys(state).reduce((acc, key) => {
    const setter = createPropertySetter(setState, key as keyof T);

    return {
      ...acc,
      [`set${key.charAt(0).toUpperCase()}${key.slice(1)}`]: setter,
    };
  }, {} as StateWithSetters<T>);

  return { ...state, ...setters };
}
