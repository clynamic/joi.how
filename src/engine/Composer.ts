export type Transformer<TArgs extends any[], TObj> = (
  ...args: TArgs
) => (obj: TObj) => TObj;

export class Composer<T extends object> {
  private obj: T;

  constructor(initial: T) {
    this.obj = initial;
  }

  /**
   * Creates a new ObjectComposer and applies the provided function to it,
   * returning the transformed object.
   */
  static build<T extends object>(
    fn: (composer: Composer<T>) => Composer<T>
  ): (obj: T) => T {
    return (obj: T) => fn(new Composer(obj)).get();
  }

  /**
   * Creates a composer focused on a specific key of the object,
   * but returns the entire object when done.
   */
  static focus<TObj extends object, K extends keyof TObj>(
    base: TObj,
    key: K,
    fn: (
      inner: Composer<Extract<TObj[K], object>>
    ) => Composer<Extract<TObj[K], object>>
  ): Composer<TObj> {
    return new Composer(base).focus(key, fn);
  }

  /**
   * Focuses on a specific key of the object, allowing for
   * transformation of that key's value.
   */
  focus<K extends keyof T>(
    key: K,
    fn: (
      composer: Composer<Extract<T[K], object>>
    ) => Composer<Extract<T[K], object>>
  ): this {
    const base = this.obj as any;
    const focused = new Composer(base[key] ?? {});
    const updated = fn(focused).get();
    this.obj = {
      ...this.obj,
      [key]: { ...(this.obj[key] as any), ...updated },
    };
    return this;
  }

  /**
   * Like `build, but specifically for composing a focus on a key
   * of an object.
   */
  static buildFocus<TObj extends object, K extends keyof TObj>(
    key: K,
    fn: (
      composer: Composer<Extract<TObj[K], object>>
    ) => Composer<Extract<TObj[K], object>>
  ): (obj: TObj) => TObj {
    return (obj: TObj) =>
      Composer.focus(
        obj,
        key,
        fn as (composer: Composer<any>) => Composer<any>
      ).get();
  }

  /**
   * Returns a new ObjectComposer with the transformed object.
   */
  map(fn: (obj: T) => T): Composer<T> {
    return new Composer(fn(this.obj));
  }

  /**
   * Chains a function that receives the composer instance.
   */
  chain(fn: (composer: this) => this): this {
    return fn(this);
  }

  /**
   * Applies a transformation tool to the current object.
   */
  apply<TArgs extends any[]>(
    tool: Transformer<TArgs, T>,
    ...args: TArgs
  ): this {
    this.obj = tool(...args)(this.obj);
    return this;
  }

  /**
   * Sets a value in a specific namespace within the object.
   */
  setIn(namespace: string, partial: object): this {
    const parts = namespace.split('.');
    const last = parts.pop()!;
    const root = { ...this.obj };
    let node: any = root;

    for (const key of parts) {
      node[key] = { ...(node[key] ?? {}) };
      node = node[key];
    }

    node[last] = {
      ...(node[last] ?? {}),
      ...partial,
    };

    this.obj = root;
    return this;
  }

  /**
   * Returns the value of a specific namespace within the object.
   */
  from<TNamespace>(namespace: string): TNamespace {
    const parts = namespace.split('.');
    let current: any = this.obj;

    for (const part of parts) {
      if (current == null) return {} as TNamespace;
      current = current[part];
    }

    return current ?? ({} as TNamespace);
  }

  /**
   * Returns the current object.
   */
  get(): T {
    return this.obj;
  }
}
