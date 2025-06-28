import { lensFromPath, Path } from './Lens';

/**
 * A curried function that that maps an object from T to T,
 * given a set of arguments.
 */
export type Transformer<TArgs extends unknown[], TObj> = (
  ...args: TArgs
) => (obj: TObj) => TObj;

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
   * A shortcut to easily build a mapping function for an object,
   * using the created composer and returning the modified object.
   */
  static build<T extends object>(
    fn: (composer: Composer<T>) => Composer<T>
  ): (obj: T) => T {
    return (obj: T) => fn(new Composer(obj)).get();
  }

  /**
   * Modifies the object, then returns it in a new Composer instance.
   */
  map(fn: (obj: T) => T): Composer<T> {
    return new Composer(fn(this.obj));
  }

  /**
   * Runs a composer function.
   */
  chain(fn: (composer: this) => this): this {
    return fn(this);
  }

  /**
   * Applies a series of mapping functions to the current object.
   */
  pipe(...pipes: ((t: T) => T)[]): this {
    for (const p of pipes) this.obj = p(this.obj);
    return this;
  }

  /**
   * Shorthand for building a composer that applies a series of mapping functions to the current object.
   */
  static pipe<T extends object>(...pipes: ((t: T) => T)[]): (obj: T) => T {
    return Composer.build<T>(composer => composer.pipe(...pipes));
  }

  /**
   * Extracts the current object from the composer.
   */
  get(): T;
  /**
   * Gets a value at the specified path in the object.
   */
  get<A = unknown>(path: Path): A;
  get<A = unknown>(path?: Path): A | T {
    if (path === undefined) return this.obj;
    return lensFromPath<T, A>(path).get(this.obj);
  }

  /**
   * Replaces the current object with a new value.
   */
  set(value: T): this;
  /**
   * Sets a value at the specified path in the object.
   */
  set<A>(path: Path, value: A): this;

  set(pathOrValue: Path | T, maybeValue?: unknown): this {
    if (maybeValue === undefined) {
      this.obj = pathOrValue as T;
    } else {
      this.obj = lensFromPath<T, unknown>(pathOrValue as Path).set(maybeValue)(
        this.obj
      );
    }
    return this;
  }

  /**
   * Shorthand for building a composer that sets a path.
   */
  static set<A>(path: Path, value: A) {
    return <T extends object>(obj: T): T =>
      Composer.build<T>(c => c.set<A>(path, value))(obj);
  }

  /**
   * Runs a composer on a sub-object at the specified path,
   * then updates the original composer and returns it.
   */
  zoom<A extends object>(
    path: Path,
    fn: (inner: Composer<A>) => Composer<A>
  ): this {
    const lens = lensFromPath<T, A>(path);
    const inner = new Composer<A>(lens.get(this.obj));
    const updated = fn(inner).get();
    this.obj = lens.set(updated)(this.obj);
    return this;
  }

  /**
   * Updates the value at the specified path with the mapping function.
   */
  over<A>(path: Path, fn: (a: A) => A): this {
    this.obj = lensFromPath<T, A>(path).over(fn)(this.obj);
    return this;
  }

  /**
   * Shorthand for building a composer that updates a path.
   */
  static over<A>(path: Path, fn: (a: A) => A) {
    return <T extends object>(obj: T): T =>
      Composer.build<T>(c => c.over<A>(path, fn))(obj);
  }

  /**
   * Runs a composer function with the value at the specified path.
   */
  bind<A>(
    path: Path,
    fn: (value: A) => (composer: Composer<T>) => Composer<T>
  ): Composer<T> {
    const lens = lensFromPath<T, A>(path);
    const value = lens.get(this.obj) ?? ({} as A);
    return fn(value)(this);
  }

  /**
   * Runs a composer function when the condition is true.
   */
  when(condition: boolean, fn: (c: this) => this): this {
    return condition ? fn(this) : this;
  }

  /**
   * Runs a composer function when the condition is false.
   */
  unless(condition: boolean, fn: (c: this) => this): this {
    return this.when(!condition, fn);
  }
}
