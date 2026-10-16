import { describe, it, expect } from 'vitest';
import { Composer } from '../../src/engine/Composer';
import { Impulses } from '../../src/engine/Impulses';
import { makeFrame } from '../utils';

const bump = Composer.over(['n'], (n: number) => n + 1, 0);

describe('Impulses', () => {
  it('should apply pushed pipes once, in order, on the next run', () => {
    const impulses = new Impulses();
    const order: string[] = [];
    impulses.push(f => (order.push('a'), f));
    impulses.push(f => (order.push('b'), f));

    impulses.pipe(makeFrame());
    impulses.pipe(makeFrame());

    expect(order).toEqual(['a', 'b']);
  });

  it('should not apply a pipe pushed during a run until the next run', () => {
    const impulses = new Impulses();
    impulses.push(f => {
      impulses.push(bump);
      return f;
    });

    const first = impulses.pipe(makeFrame());
    const second = impulses.pipe(first);

    expect(first.n).toBeUndefined();
    expect(second.n).toBe(1);
  });

  it('should drop everything on clear', () => {
    const impulses = new Impulses();
    impulses.push(bump);
    impulses.clear();

    expect(impulses.pipe(makeFrame()).n).toBeUndefined();
  });
});
