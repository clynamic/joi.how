import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openDB } from 'idb';
import { ImageType } from '../../src/types';

vi.mock('../../src/services/resize', () => ({
  LowResImageSize: { thumbnail: 'thumbnail', preview: 'preview' },
  generateLowResImage: vi.fn(async () => {
    throw new Error('no canvas');
  }),
}));

import { generateLowResImage } from '../../src/services/resize';
import { Bytes } from '../../src/services/bytes';
import { LocalImageService } from '../../src/services/localImages';

const blobOf = async (text: string) => new Blob([text], { type: 'image/png' });

if (!Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function () {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}

let made = 0;
let opened = 0;

const fresh = () => {
  opened += 1;
  const store = new Bytes(`test-local-bytes-${opened}`);
  const legacy = `test-local-legacy-${opened}`;
  return {
    store,
    legacy,
    service: new LocalImageService(store.for('core.local'), legacy),
  };
};

describe('LocalImageService', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => `blob:${++made}`);
    URL.revokeObjectURL = vi.fn();
  });

  it('should list the ids of stored images', async () => {
    const { service } = fresh();
    const stored = await service.storeImage([
      { blob: await blobOf('one'), type: ImageType.image, name: 'one.png' },
      { blob: await blobOf('three'), type: ImageType.image, name: 'three.png' },
    ]);

    const ids = await service.listIds();

    expect(ids.sort()).toEqual(stored.map(i => i.id).sort());
  });

  it('should keep stored files in the byte store', async () => {
    const { store, service } = fresh();
    const stored = await service.storeImage({
      blob: await blobOf('kept'),
      type: ImageType.image,
      name: 'kept.png',
    });

    expect(await store.keys('core.local/')).toEqual([
      `core.local/${stored.id}/full`,
    ]);
  });

  it('should keep a made thumbnail in the byte store', async () => {
    const { store, service } = fresh();
    vi.mocked(generateLowResImage).mockResolvedValueOnce(await blobOf('small'));
    const stored = await service.storeImage({
      blob: await blobOf('large'),
      type: ImageType.image,
      name: 'large.png',
    });

    await service.url(stored.id, 'thumbnail', ImageType.image);

    expect((await store.keys('core.local/')).sort()).toEqual([
      `core.local/${stored.id}/full`,
      `core.local/${stored.id}/thumbnail`,
    ]);
  });

  it('should serve the full file when a thumbnail cannot be made', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { service } = fresh();
    const stored = await service.storeImage({
      blob: await blobOf('picture'),
      type: ImageType.image,
      name: 'picture.png',
    });

    const thumbnail = await service.url(
      stored.id,
      'thumbnail',
      ImageType.image
    );

    expect(thumbnail).toBe(
      await service.url(stored.id, 'full', ImageType.image)
    );
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('should reject an id with no stored file', async () => {
    const { service } = fresh();

    await expect(
      service.url('missing', 'full', ImageType.image)
    ).rejects.toThrow('nothing stored');
  });

  it('should remove the files of an image', async () => {
    const { store, service } = fresh();
    const [gone, kept] = await service.storeImage([
      { blob: await blobOf('gone'), type: ImageType.image, name: 'gone.png' },
      { blob: await blobOf('kept'), type: ImageType.image, name: 'kept.png' },
    ]);

    await service.removeImage(gone.id);

    expect(await store.keys('core.local/')).toEqual([
      `core.local/${kept.id}/full`,
    ]);
  });

  it('should move images stored by the earlier version into the byte store', async () => {
    const { store, legacy, service } = fresh();
    const db = await openDB(legacy, 1, {
      upgrade(db) {
        db.createObjectStore('images', { keyPath: 'id' });
      },
    });
    await db.put('images', {
      id: 'old.png-abc',
      name: 'old.png',
      hash: 'abc',
      type: ImageType.image,
      full: await blobOf('old'),
      thumbnail: await blobOf('old small'),
    });
    db.close();

    expect(await service.listIds()).toEqual(['old.png-abc']);
    expect((await store.keys('core.local/')).sort()).toEqual([
      'core.local/old.png-abc/full',
      'core.local/old.png-abc/thumbnail',
    ]);
    expect((await indexedDB.databases()).map(d => d.name)).not.toContain(
      legacy
    );
  });

  it('should ask for persistent storage when storing', async () => {
    const persist = vi.fn(async () => true);
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { persist },
    });
    const { service } = fresh();

    await service.storeImage({
      blob: await blobOf('kept'),
      type: ImageType.image,
      name: 'kept.png',
    });
    await service.storeImage({
      blob: await blobOf('again'),
      type: ImageType.image,
      name: 'again.png',
    });

    expect(persist).toHaveBeenCalledTimes(1);
  });
});
