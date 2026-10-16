import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Events } from '../../../src/engine/pipes/Events';
import {
  ModuleManager,
  moduleManagerPipe,
} from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Image from '../../../src/game/plugins/image';
import { ImageItem, ImageServiceType, ImageType } from '../../../src/types';
import { makeFrame, tick } from '../../utils';

const gamePipe: Pipe = Composer.pipe(Events.pipe, moduleManagerPipe);

const img = (id: string): ImageItem => ({
  id,
  type: ImageType.image,
  thumbnail: `${id}-thumb`,
  preview: `${id}-preview`,
  full: `${id}-full`,
  source: `${id}-source`,
  service: ImageServiceType.local,
});

const state = (frame: GameFrame) => frame.core.images;

function bootstrap(): GameFrame {
  return gamePipe(tick(ModuleManager.load(Image)(gamePipe(makeFrame()))));
}

function step(frame: GameFrame, impulse: Pipe): GameFrame {
  return Composer.pipe(impulse, gamePipe)(tick(frame));
}

describe('Image', () => {
  it('should queue pushed images without showing them', () => {
    const frame = step(
      bootstrap(),
      Composer.pipe(
        Image.pushNextImage(img('a')),
        Image.pushNextImage(img('b'))
      )
    );

    expect(state(frame).currentImage).toBeUndefined();
    expect(state(frame).nextImages.map((i: ImageItem) => i.id)).toEqual([
      'a',
      'b',
    ]);
  });

  it('should show the head of the queue on advance', () => {
    let frame = step(
      bootstrap(),
      Composer.pipe(
        Image.pushNextImage(img('a')),
        Image.pushNextImage(img('b'))
      )
    );
    frame = step(frame, Image.advance());

    expect(state(frame).currentImage?.id).toBe('a');
    expect(state(frame).nextImages.map((i: ImageItem) => i.id)).toEqual(['b']);
  });

  it('should keep the current image when advancing an empty queue', () => {
    let frame = step(bootstrap(), Image.pushNextImage(img('a')));
    frame = step(frame, Image.advance());
    frame = step(frame, Image.advance());

    expect(state(frame).currentImage?.id).toBe('a');
    expect(state(frame).nextImages).toEqual([]);
  });
});
