import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Bytes } from '../../src/services/bytes';

const blob = (text: string) => new Blob([text], { type: 'text/plain' });

describe('Bytes', () => {
  let made = 0;
  const revoked: string[] = [];

  beforeEach(() => {
    made = 0;
    revoked.length = 0;
    URL.createObjectURL = vi.fn(() => `blob:${++made}`);
    URL.revokeObjectURL = vi.fn((url: string) => {
      revoked.push(url);
    });
  });

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

  it('should hand out one url per key until it is freed', async () => {
    const store = new Bytes('test-bytes-3');
    await store.put('a/full', blob('1'));

    const first = await store.url('a/full');
    expect(await store.url('a/full')).toBe(first);

    store.free('a/full');
    expect(revoked).toEqual([first]);
    expect(await store.url('a/full')).not.toBe(first);
  });

  it('should reject a url for a key with nothing stored', async () => {
    const store = new Bytes('test-bytes-4');

    await expect(store.url('a/missing')).rejects.toThrow('a/missing');
  });

  it('should free the url of a deleted key', async () => {
    const store = new Bytes('test-bytes-5');
    await store.put('a/full', blob('1'));
    const url = await store.url('a/full');

    await store.delete('a/full');

    expect(revoked).toEqual([url]);
  });

  it('should keep the files of a plugin under its id', async () => {
    const store = new Bytes('test-bytes-6');
    const files = store.for('me.plugin');
    await files.put('a/full', blob('1'));
    await store.put('other/b', blob('2'));

    expect(await store.keys('me.plugin/')).toEqual(['me.plugin/a/full']);
    expect(await files.keys()).toEqual(['a/full']);
    expect(await files.get('a/full')).toBeDefined();

    await files.delete('a/full');
    expect(await store.keys()).toEqual(['other/b']);
  });
});
