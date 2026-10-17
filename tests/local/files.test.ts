import { describe, it, expect } from 'vitest';
import { withoutMissingLocals } from '../../src/local/files';
import { ImageItem, ImageServiceType, ImageType } from '../../src/types';

const item = (id: string, service: ImageServiceType): ImageItem => ({
  id,
  service,
  type: ImageType.image,
  source: id,
  thumbnail: id,
  preview: id,
  full: id,
});

describe('withoutMissingLocals', () => {
  it('should drop local images whose files are gone and keep the rest', () => {
    const images = [
      item('a', ImageServiceType.local),
      item('b', ImageServiceType.local),
      item('c', ImageServiceType.e621),
    ];

    const kept = withoutMissingLocals(images, new Set(['a']));

    expect(kept.map(i => i.id)).toEqual(['a', 'c']);
  });
});
