import { describe, it, expect } from 'vitest';
import { Composer } from './Composer';

describe('Composer', () => {
  describe('instance methods', () => {
    describe('chain', () => {
      it('should chain composer functions', () => {
        const obj = { count: 5 };
        const result = new Composer(obj)
          .chain(c => c.set('count', 10))
          .chain(c => c.over<number>('count', x => x * 2))
          .get();

        expect(result.count).toBe(20);
      });
    });

    describe('pipe', () => {
      it('should apply multiple functions in sequence', () => {
        const obj = { value: 1 };
        const result = new Composer(obj)
          .pipe(
            o => ({ ...o, value: o.value + 1 }),
            o => ({ ...o, value: o.value * 2 })
          )
          .get();

        expect(result.value).toBe(4);
      });
    });

    describe('get', () => {
      it('should get the whole object when no path provided', () => {
        const obj = { foo: 'bar' };
        const result = new Composer(obj).get();

        expect(result).toEqual({ foo: 'bar' });
      });

      it('should get nested value', () => {
        const obj = { a: { b: { c: 42 } } };
        const result = new Composer(obj).get<number>('a.b.c');

        expect(result).toBe(42);
      });
    });

    describe('set', () => {
      it('should replace entire object', () => {
        const obj = { old: 'value' };
        const result = new Composer<any>(obj).set({ new: 'value' }).get();

        expect(result).toEqual({ new: 'value' });
      });

      it('should set nested value', () => {
        const obj = { a: { b: 1 } };
        const result = new Composer(obj).set('a.b', 42).get();

        expect(result.a.b).toBe(42);
      });
    });

    describe('zoom', () => {
      it('should compose on a nested object', () => {
        const obj = {
          user: {
            name: 'Alice',
            age: 30,
          },
        };

        const result = new Composer(obj)
          .zoom('user', c => c.set('age', 31).set('name', 'Bob'))
          .get();

        expect(result.user.name).toBe('Bob');
        expect(result.user.age).toBe(31);
      });
    });

    describe('over', () => {
      it('should update a nested property', () => {
        const obj = { counter: 5 };
        const result = new Composer(obj)
          .over<number>('counter', x => x + 1)
          .get();

        expect(result.counter).toBe(6);
      });
    });

    describe('bind', () => {
      it('should read value and apply transformer', () => {
        const obj = { x: 10, y: 0 };
        const result = new Composer(obj)
          .bind<number>('x', x => o => ({ ...o, y: x * 2 }))
          .get();

        expect(result.y).toBe(20);
        expect(result.x).toBe(10);
      });
    });

    describe('when', () => {
      it('should apply function when condition is true', () => {
        const obj = { value: 5 };
        const result = new Composer(obj)
          .when(true, c => c.set('value', 10))
          .get();

        expect(result.value).toBe(10);
      });

      it('should skip function when condition is false', () => {
        const obj = { value: 5 };
        const result = new Composer(obj)
          .when(false, c => c.set('value', 10))
          .get();

        expect(result.value).toBe(5);
      });
    });

    describe('unless', () => {
      it('should skip function when condition is true', () => {
        const obj = { value: 5 };
        const result = new Composer(obj)
          .unless(true, c => c.set('value', 10))
          .get();

        expect(result.value).toBe(5);
      });

      it('should apply function when condition is false', () => {
        const obj = { value: 5 };
        const result = new Composer(obj)
          .unless(false, c => c.set('value', 10))
          .get();

        expect(result.value).toBe(10);
      });
    });
  });

  describe('static methods', () => {
    describe('Composer.chain', () => {
      it('should create a function that chains composers', () => {
        const fn = Composer.chain<{ count: number }>(c =>
          c.set('count', 10).over<number>('count', x => x * 2)
        );

        const result = fn({ count: 5 });
        expect(result.count).toBe(20);
      });
    });

    describe('Composer.pipe', () => {
      it('should create a function that pipes transformations', () => {
        const fn = Composer.pipe<{ value: number }>(
          o => ({ ...o, value: o.value + 1 }),
          o => ({ ...o, value: o.value * 2 })
        );

        const result = fn({ value: 1 });
        expect(result.value).toBe(4);
      });
    });

    describe('Composer.get', () => {
      it('should create a getter function', () => {
        const getValue = Composer.get<number>('a.b.c');
        const result = getValue({ a: { b: { c: 42 } } });

        expect(result).toBe(42);
      });
    });

    describe('Composer.set', () => {
      it('should create a setter function', () => {
        const setCount = Composer.set('count', 100);
        const result = setCount({ count: 0 });

        expect(result.count).toBe(100);
      });
    });

    describe('Composer.zoom', () => {
      it('should create a zoom function', () => {
        const updateUser = Composer.zoom<{ age: number }>('user', u => ({
          ...u,
          age: u.age + 1,
        }));

        const result = updateUser({ user: { age: 30 } });
        expect(result.user.age).toBe(31);
      });
    });

    describe('Composer.over', () => {
      it('should create an over function', () => {
        const increment = Composer.over<number>('counter', x => x + 1);
        const result = increment({ counter: 5 });

        expect(result.counter).toBe(6);
      });

      it('should update a deeply nested object', () => {
        const obj = {
          data: {
            user: {
              profile: {
                scores: [10, 20, 30],
              },
            },
          },
        };

        const result = Composer.over<number[]>(
          ['data', 'user.profile.scores'],
          scores => [...scores, 40]
        )(obj);

        expect(result.data.user.profile.scores).toEqual([10, 20, 30, 40]);
      });
    });

    describe('Composer.bind', () => {
      it('should create a bind function', () => {
        const fn = Composer.bind<number>('x', x => o => ({ ...o, y: x * 2 }));
        const result = fn({ x: 10, y: 0 });

        expect(result.y).toBe(20);
      });
    });

    describe('Composer.when', () => {
      it('should create a conditional function (true)', () => {
        const fn = Composer.when<{ value: number }>(true, o => ({
          ...o,
          value: o.value * 2,
        }));

        const result = fn({ value: 5 });
        expect(result.value).toBe(10);
      });

      it('should create a conditional function (false)', () => {
        const fn = Composer.when<{ value: number }>(false, o => ({
          ...o,
          value: o.value * 2,
        }));

        const result = fn({ value: 5 });
        expect(result.value).toBe(5);
      });
    });

    describe('Composer.unless', () => {
      it('should create a conditional function (true)', () => {
        const fn = Composer.unless<{ value: number }>(true, o => ({
          ...o,
          value: o.value * 2,
        }));

        const result = fn({ value: 5 });
        expect(result.value).toBe(5);
      });

      it('should create a conditional function (false)', () => {
        const fn = Composer.unless<{ value: number }>(false, o => ({
          ...o,
          value: o.value * 2,
        }));

        const result = fn({ value: 5 });
        expect(result.value).toBe(10);
      });
    });
  });
});
