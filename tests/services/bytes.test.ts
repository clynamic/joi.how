import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { Bytes } from '../../src/services/bytes';

const blob = (text: string) => new Blob([text], { type: 'text/plain' });

describe('Bytes', () => {
  it('should store a blob under a key and give it back', async () => {
    const store = new Bytes('test-bytes-1');
    await store.put('a/full', blob('hello'));

    expect(await store.get('a/full')).toBeDefined();
    expect(await store.get('a/missing')).toBeUndefined();
  });

  it('should list keys under a prefix and delete several at once', async () => {
    const store = new Bytes('test-bytes-2');
    await store.put('a/full', blob('1'));
    await store.put('a/thumb', blob('2'));
    await store.put('b/full', blob('3'));

    expect((await store.keys('a/')).sort()).toEqual(['a/full', 'a/thumb']);
    await store.delete(['a/full', 'a/thumb']);
    expect(await store.keys()).toEqual(['b/full']);
  });
});
