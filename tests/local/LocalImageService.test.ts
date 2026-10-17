import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImageType } from '../../src/types';

vi.mock('../../src/local/resize', () => ({
  LowResImageSize: { thumbnail: 'thumbnail', preview: 'preview' },
  generateLowResImage: vi.fn(async () => {
    throw new Error('no canvas');
  }),
}));

import { localImageService } from '../../src/local/LocalImageService';

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

describe('LocalImageService', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn((blob: Blob) =>
      blob ? 'blob:stored' : 'blob:none'
    );
  });

  it('should list the ids of stored images', async () => {
    const stored = await localImageService.storeImage([
      { blob: await blobOf('one'), type: ImageType.image, name: 'one.png' },
      { blob: await blobOf('three'), type: ImageType.image, name: 'three.png' },
    ]);

    const ids = await localImageService.listIds();

    expect(ids).toEqual(expect.arrayContaining(stored.map(i => i.id)));
  });

  it('should serve the full file when a thumbnail cannot be made', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const stored = await localImageService.storeImage({
      blob: await blobOf('picture'),
      type: ImageType.image,
      name: 'picture.png',
    });

    const url = await localImageService.resolveUrl(
      `local://thumbnail/${stored.id}`
    );

    expect(url).toBe('blob:stored');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('should reject an id with no stored file', async () => {
    await expect(
      localImageService.resolveUrl('local://full/missing')
    ).rejects.toThrow('not found');
  });

  it('should ask for persistent storage when storing', async () => {
    const persist = vi.fn(async () => true);
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { persist },
    });

    await localImageService.storeImage({
      blob: await blobOf('kept'),
      type: ImageType.image,
      name: 'kept.png',
    });
    await localImageService.storeImage({
      blob: await blobOf('again'),
      type: ImageType.image,
      name: 'again.png',
    });

    expect(persist).toHaveBeenCalledTimes(1);
  });
});
