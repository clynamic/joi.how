export type Lens<S, A> = {
  get: (source: S) => A;
  set: (value: A) => (source: S) => S;
  over: (fn: (a: A) => A, fallback?: A) => (source: S) => S;
};

export type StringPath = (string | number | symbol)[] | string;

export type TypedPath<T> = (string | number | symbol)[] & {
  readonly __type?: T;
} & (T extends object
    ? { readonly [K in keyof T]-?: TypedPath<T[K]> }
    : unknown);

export type Path<T = unknown> = StringPath | TypedPath<T>;

export function typedPath<T>(
  segments: (string | number | symbol)[]
): TypedPath<T> {
  return new Proxy(segments, {
    get(target, prop, receiver) {
      if (prop in target || typeof prop === 'symbol') {
        return Reflect.get(target, prop, receiver);
      }
      return typedPath([...target, prop as string]);
    },
  }) as unknown as TypedPath<T>;
}

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
      over:
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (fn: (a: A) => A, _fallback = {} as A) =>
          (source: S) =>
            fn(source as unknown as A) as unknown as S,
    };
  }

  const lens: Lens<S, A> = {
    get: (source: S): A => {
      return parts.reduce((acc: unknown, key: any) => {
        if (acc == null || typeof acc !== 'object') return undefined;
        return (acc as any)[key];
      }, source) as A;
    },

    set:
      (value: A) =>
      (source: S): S => {
        const root = { ...source } as any;
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
      (fn: (a: A) => A, fallback = {} as A) =>
      (source: S): S => {
        const current = lens.get(source) ?? fallback;
        return lens.set(fn(current))(source);
      },
  };

  return lens;
}
