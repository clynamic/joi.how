import { cloneDeep } from 'lodash';

export type Lens<S, A> = {
  get: (source: S) => A;
  set: (value: A) => (source: S) => S;
  over: (fn: (a: A) => A) => (source: S) => S;
};

export type Path = (string | number | symbol)[] | string;

export function normalizePath(path: Path): (string | number | symbol)[] {
  if (Array.isArray(path)) {
    return path.flatMap<string | number | symbol>(segment => {
      if (typeof segment === 'string') {
        return segment.split('.') as string[];
      }
      return [segment];
    });
  }
  return path.split('.') as string[];
}

export function lensFromPath<S = any, A = any>(path: Path): Lens<S, A> {
  const parts = normalizePath(path);

  if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) {
    return {
      get: (source: S) => source as unknown as A,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      set: (value: A) => (_source: S) => value as unknown as S,
      over: (fn: (a: A) => A) => (source: S) =>
        fn(source as unknown as A) as unknown as S,
    };
  }

  return {
    get: (source: S): A => {
      return parts.reduce((acc: unknown, key: any) => {
        if (acc == null || typeof acc !== 'object') return undefined;
        return (acc as any)[key];
      }, source) as A;
    },

    set:
      (value: A) =>
      (source: S): S => {
        const root = cloneDeep(source) as any;
        let node = root;

        for (let i = 0; i < parts.length - 1; i++) {
          const key = parts[i];
          node[key] = { ...(node[key] ?? {}) };
          node = node[key];
        }

        node[parts[parts.length - 1]] = value;
        return root;
      },

    over:
      (fn: (a: A) => A) =>
      (source: S): S => {
        const current = lensFromPath<S, A>(parts).get(source) ?? ({} as A);
        return lensFromPath<S, A>(parts).set(fn(current))(source);
      },
  };
}
