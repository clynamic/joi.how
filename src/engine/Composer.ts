import { lensFromPath, Path } from './Lens';
import { deepFreeze } from './freeze';

/**
 * A curried function that that maps an object from T to T,
 * given a set of arguments.
 */
export type Transformer<TArgs extends unknown[], TObj> = (
  ...args: TArgs
) => (obj: TObj) => TObj;

export type Compositor<T extends object> = (
  composer: Composer<T>
) => Composer<T>;

export type ComposerScope<T extends object> = {
  [K in keyof Composer<T> as Composer<T>[K] extends (...args: any[]) => any
    ? K
    : never]: Composer<T>[K];
};

function _pipe<T>(obj: T, pipes: ((t: T) => T)[]): T {
  let result = obj;
  for (const p of pipes) result = p(result);
  return result;
}

function _set<T, A>(obj: T, path: Path<A>, value: A): T {
  return lensFromPath<T, A>(path).set(value)(obj);
}

function _over<T, A>(obj: T, path: Path<A>, fn: (a: A) => A, fallback?: A): T {
  return lensFromPath<T, A>(path).over(fn, fallback)(obj);
}

function _bind<T, A>(obj: T, path: Path<A>, fn: Transformer<[A], T>): T {
  const value = lensFromPath<T, A>(path).get(obj);
  return fn(value)(obj);
}

function _zoom<T, A extends object>(obj: T, path: Path, fn: (a: A) => A): T {
  const lens = lensFromPath<T, A>(path);
  return lens.set(fn(lens.get(obj)))(obj);
}

/**
 * A generalized object manipulation utility
 * in a functional chaining style.
 */
export class Composer<T extends object> {
  private obj: T;

  constructor(initial: T) {
    this.obj = initial;
  }

  /**
   * Runs a composer function.
   */
  chain(fn: (composer: this) => this): this {
    return fn(this);
  }

  /**
   * Shorthand for building a composer that runs a function.
   */
  static chain<T extends object>(fn: Compositor<T>): (obj: T) => T {
    return (obj: T) => fn(new Composer(obj)).get();
  }

  /**
   * Applies a series of mapping functions to the current object.
   */
  pipe(...pipes: ((t: T) => T)[]): this {
    this.obj = _pipe(this.obj, pipes);
    return this;
  }

  /**
   * Shorthand for building a composer that applies a series of mapping functions to the current object.
   */
  static pipe<T extends object>(...pipes: ((t: T) => T)[]): (obj: T) => T {
    return (obj: T): T => _pipe(obj, pipes);
  }

  /**
   * Extracts the current object from the composer.
   */
  get(): T;
  /**
   * Gets a value at the specified path in the object.
   */
  get<A = unknown>(path: Path<A>): A;
  get<A = unknown>(path?: Path<A>): A | T {
    if (path === undefined) return this.obj;
    const val = lensFromPath<T, A>(path).get(this.obj);
    // Modifying an object retrieved from the composer would cause bugs
    if (import.meta.env.DEV) return deepFreeze(val);
    return val;
  }

  /**
   * Shorthand for getting a value at the specified path from an object.
   */
  static get<A = unknown>(path: Path<A>) {
    return <T extends object>(obj: T): A => lensFromPath<T, A>(path).get(obj);
  }

  /**
   * Replaces the current object with a new value.
   */
  set(value: T): this;
  /**
   * Sets a value at the specified path in the object.
   */
  set<A>(path: Path<A>, value: A): this;

  set(pathOrValue: Path | T, maybeValue?: unknown): this {
    if (maybeValue === undefined) {
      this.obj = pathOrValue as T;
    } else {
      this.obj = _set(this.obj, pathOrValue as Path, maybeValue);
    }
    return this;
  }

  /**
   * Shorthand for building a composer that sets a path.
   */
  static set<A>(path: Path<A>, value: A) {
    return <T extends object>(obj: T): T => _set(obj, path, value);
  }

  /**
   * Runs a composer on a sub-object at the specified path,
   * then updates the original composer and returns it.
   */
  zoom<A extends object>(path: Path, fn: Compositor<A>): this {
    const lens = lensFromPath<T, A>(path);
    const inner = new Composer<A>(lens.get(this.obj));
    const updated = fn(inner).get();
    this.obj = lens.set(updated)(this.obj);
    return this;
  }

  /**
   * Shorthand for building a composer that zooms into a path
   */
  static zoom<A extends object>(path: Path, fn: (a: A) => A) {
    return <T extends object>(obj: T): T => _zoom<T, A>(obj, path, fn);
  }

  /**
   * Updates the value at the specified path with the mapping function.
   */
  over<A>(path: Path<A>, fn: (a: A) => A, fallback?: A): this {
    this.obj = _over(this.obj, path, fn, fallback);
    return this;
  }

  /**
   * Shorthand for building a composer that updates a path.
   */
  static over<A>(path: Path<A>, fn: (a: A) => A, fallback?: A) {
    return <T extends object>(obj: T): T => _over(obj, path, fn, fallback);
  }

  /**
   * Runs a composer function with the value at the specified path.
   */
  bind<A>(path: Path<A>, fn: Transformer<[A], T>): this {
    this.obj = _bind(this.obj, path, fn);
    return this;
  }

  /**
   * Shorthand for building a composer that reads a value at a path and applies a transformer.
   */
  static bind<A>(path: Path<A>, fn: Transformer<[A], any>) {
    return <T extends object>(obj: T): T => _bind(obj, path, fn);
  }

  call<A extends (...args: any[]) => (obj: any) => any>(
    path: Path<A>,
    ...args: Parameters<A>
  ): this {
    this.obj = _bind(this.obj, path, (fn: A) => fn(...args));
    return this;
  }

  static call<A extends (...args: any[]) => (obj: any) => any>(
    path: Path<A>,
    ...args: Parameters<A>
  ) {
    return <T extends object>(obj: T): T =>
      _bind(obj, path, (fn: A) => fn(...args));
  }

  /**
   * Runs a composer function when the condition is true.
   */
  when(
    condition: boolean,
    fn: (c: this) => this,
    elseFn?: (c: this) => this
  ): this {
    if (condition) return fn(this);
    return elseFn ? elseFn(this) : this;
  }

  /**
   * Shorthand for building a composer that runs a function when the condition is true.
   */
  static when<T extends object>(
    condition: boolean,
    fn: (obj: T) => T,
    elseFn?: (obj: T) => T
  ): (obj: T) => T {
    if (condition) return fn;
    return elseFn ?? ((obj: T) => obj);
  }

  /**
   * Runs a composer function when the condition is false.
   */
  unless(condition: boolean, fn: (c: this) => this): this {
    return this.when(!condition, fn);
  }

  /**
   * Shorthand for building a composer that runs a function when the condition is false.
   */
  static unless<T extends object>(
    condition: boolean,
    fn: (obj: T) => T
  ): (obj: T) => T {
    return Composer.when<T>(!condition, fn);
  }

  /**
   * Runs an imperative block with destructured scope methods (get, set, over, pipe, bind).
   */
  static do<T extends object>(
    fn: (scope: ComposerScope<T>) => void
  ): (obj: T) => T {
    return (obj: T): T => {
      const c = new Composer(obj);
      const scope = {} as ComposerScope<T>;

      // bind all composer methods to the scope object
      for (const key of Object.getOwnPropertyNames(Composer.prototype)) {
        if (key === 'constructor' || typeof (c as any)[key] !== 'function')
          continue;
        (scope as any)[key] = (c as any)[key].bind(c);
      }

      if (import.meta.env.DEV) {
        let sealed = false;

        // throw if scope is used after block returns (leaked references)
        for (const key of Object.keys(scope)) {
          const method = (scope as any)[key];
          (scope as any)[key] = (...args: any[]) => {
            if (sealed)
              throw new Error('Composer.do() scope used after block completed');
            return method(...args);
          };
        }

        const result: unknown = fn(scope);

        // catch async callbacks that would silently lose writes
        if (result && typeof (result as any).then === 'function') {
          throw new Error('Composer.do() callback must not be async');
        }
        sealed = true;
      } else {
        fn(scope);
      }

      return c.get();
    };
  }
}
