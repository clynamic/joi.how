import { describe, it, expect } from 'vitest';
import { lensFromPath, normalizePath } from './Lens';

describe('Lens', () => {
  describe('normalizePath', () => {
    it('should split string paths by dots', () => {
      expect(normalizePath('a.b.c')).toEqual(['a', 'b', 'c']);
    });

    it('should handle single segment paths', () => {
      expect(normalizePath('foo')).toEqual(['foo']);
    });

    it('should return array paths as-is', () => {
      expect(normalizePath(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should flatten array paths with dotted strings', () => {
      expect(normalizePath(['a', 'b.c', 'd'])).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should handle numeric keys', () => {
      expect(normalizePath(['arr', 0, 'prop'])).toEqual(['arr', 0, 'prop']);
    });

    it('should handle symbol keys', () => {
      const sym = Symbol('test');
      expect(normalizePath(['obj', sym])).toEqual(['obj', sym]);
    });
  });

  describe('lensFromPath', () => {
    describe('get', () => {
      it('should retrieve a nested value', () => {
        const lens = lensFromPath<{ a: { b: number } }, number>('a.b');
        const obj = { a: { b: 42 } };

        expect(lens.get(obj)).toBe(42);
      });

      it('should return undefined for missing paths', () => {
        const lens = lensFromPath<{ a: { b?: number } }, number>('a.b');
        const obj = { a: {} };

        expect(lens.get(obj)).toBeUndefined();
      });

      it('should return undefined for null/undefined intermediate values', () => {
        const lens = lensFromPath<{ a: null }, any>('a.b');
        const obj = { a: null };

        expect(lens.get(obj)).toBeUndefined();
      });

      it('should handle array indexing', () => {
        const lens = lensFromPath<{ arr: number[] }, number>(['arr', 1]);
        const obj = { arr: [10, 20, 30] };

        expect(lens.get(obj)).toBe(20);
      });

      it('should handle empty path (identity)', () => {
        const lens = lensFromPath<{ foo: string }, { foo: string }>('');
        const obj = { foo: 'bar' };

        expect(lens.get(obj)).toEqual(obj);
      });
    });

    describe('set', () => {
      it('should set a nested value', () => {
        const lens = lensFromPath<{ a: { b: number } }, number>('a.b');
        const obj = { a: { b: 1 } };

        const result = lens.set(42)(obj);

        expect(result.a.b).toBe(42);
        expect(obj.a.b).toBe(1);
      });

      it('should create missing intermediate objects', () => {
        const lens = lensFromPath<{ a?: { b?: number } }, number>('a.b');
        const obj = {};

        const result = lens.set(42)(obj);

        expect(result.a?.b).toBe(42);
      });

      it('should not mutate the original object', () => {
        const lens = lensFromPath<{ a: { b: number } }, number>('a.b');
        const obj = { a: { b: 1 } };

        const result = lens.set(42)(obj);

        expect(result).not.toBe(obj);
        expect(result.a).not.toBe(obj.a);
        expect(obj.a.b).toBe(1);
      });

      it('should handle array indexing', () => {
        const lens = lensFromPath<{ arr: number[] }, number>(['arr', 1]);
        const obj = { arr: [10, 20, 30] };

        const result = lens.set(99)(obj);

        expect(result.arr[1]).toBe(99);
        expect(obj.arr[1]).toBe(20);
      });

      it('should handle empty path (replace entire value)', () => {
        const lens = lensFromPath<{ foo: string }, { foo: string }>('');
        const obj = { foo: 'bar' };

        const result = lens.set({ foo: 'baz' })(obj);

        expect(result).toEqual({ foo: 'baz' });
        expect(obj.foo).toBe('bar');
      });
    });

    describe('over', () => {
      it('should handle empty path (transform entire value)', () => {
        const lens = lensFromPath<{ count: number }, { count: number }>('');
        const obj = { count: 5 };

        const result = lens.over(x => ({ count: x.count * 2 }))(obj);

        expect(result).toEqual({ count: 10 });
        expect(obj.count).toBe(5);
      });

      it('should transform a nested value', () => {
        const lens = lensFromPath<{ a: { b: number } }, number>('a.b');
        const obj = { a: { b: 5 } };

        const result = lens.over(x => x * 2)(obj);

        expect(result.a.b).toBe(10);
        expect(obj.a.b).toBe(5);
      });

      it('should provide empty object when value is undefined', () => {
        const lens = lensFromPath<
          { a?: { b?: { value: number } } },
          { value: number }
        >('a.b');
        const obj = {};

        const result = lens.over(x => ({ value: (x.value || 0) + 1 }))(obj);

        expect(result.a?.b?.value).toBe(1);
      });

      it('should not mutate the original object', () => {
        const lens = lensFromPath<{ a: { b: number } }, number>('a.b');
        const obj = { a: { b: 1 } };

        const result = lens.over(x => x + 10)(obj);

        expect(result).not.toBe(obj);
        expect(result.a).not.toBe(obj.a);
        expect(obj.a.b).toBe(1);
      });

      it('should handle array transformations', () => {
        const lens = lensFromPath<{ arr: number[] }, number>(['arr', 0]);
        const obj = { arr: [1, 2, 3] };

        const result = lens.over(x => x * 10)(obj);

        expect(result.arr[0]).toBe(10);
        expect(obj.arr[0]).toBe(1);
      });

      it('should handle complex transformations', () => {
        type State = {
          plugins: {
            active: string[];
            inserting: string[];
          };
        };

        const lens = lensFromPath<State, State['plugins']>('plugins');
        const obj: State = {
          plugins: {
            active: ['a', 'b'],
            inserting: [],
          },
        };

        const result = lens.over(plugins => ({
          active: [...plugins.active, ...plugins.inserting],
          inserting: [],
        }))(obj);

        expect(result.plugins.active).toEqual(['a', 'b']);
        expect(result.plugins.inserting).toEqual([]);
        expect(obj.plugins.active).toEqual(['a', 'b']);
      });
    });

    describe('deeply nested paths', () => {
      it('should handle deep nesting', () => {
        const lens = lensFromPath<
          { a: { b: { c: { d: { e: number } } } } },
          number
        >('a.b.c.d.e');
        const obj = { a: { b: { c: { d: { e: 42 } } } } };

        expect(lens.get(obj)).toBe(42);

        const result = lens.set(99)(obj);
        expect(result.a.b.c.d.e).toBe(99);
        expect(obj.a.b.c.d.e).toBe(42);
      });
    });
  });
});
