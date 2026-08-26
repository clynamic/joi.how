import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Events } from '../../../src/engine/pipes/Events';
import { Scheduler } from '../../../src/engine/pipes/Scheduler';
import {
  ModuleManager,
  moduleManagerPipe,
} from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import { typedPath } from '../../../src/engine/Lens';
import Image from '../../../src/game/plugins/image';
import Rand from '../../../src/game/plugins/rand';
import RandomImages, {
  getImageSwitchDuration,
} from '../../../src/game/plugins/randomImages';
import { ImageItem, ImageServiceType, ImageType } from '../../../src/types';
import { defaultSettings } from '../../../src/settings/Settings';
import { makeFrame, tick } from '../../utils';

const gamePipe: Pipe = Composer.pipe(
  Events.pipe,
  Scheduler.pipe,
  moduleManagerPipe
);

const withImpulse = (impulse: Pipe): Pipe => Composer.pipe(impulse, gamePipe);

const makeImage = (id: string): ImageItem => ({
  id,
  type: ImageType.image,
  thumbnail: `${id}-thumb`,
  preview: `${id}-preview`,
  full: `${id}-full`,
  source: `${id}-source`,
  service: ImageServiceType.local,
});

function startImages(overrides?: Partial<typeof defaultSettings>): GameFrame {
  let frame = gamePipe(makeFrame());

  frame = Composer.set(typedPath(['settings']), {
    ...defaultSettings,
    ...overrides,
  })(frame);
  frame = Composer.set(typedPath(['images']), [
    makeImage('a'),
    makeImage('b'),
    makeImage('c'),
  ])(frame);
  frame = Composer.set(typedPath(['core.intensity']), { intensity: 0 })(frame);

  frame = ModuleManager.load(Rand)(frame);
  frame = ModuleManager.load(Image)(frame);
  frame = ModuleManager.load(RandomImages)(frame);

  frame = gamePipe(tick(frame));
  frame = gamePipe(tick(frame));

  return frame;
}

function getScheduled(frame: GameFrame) {
  return (frame as any)?.core?.scheduler?.scheduled ?? [];
}

function switchDuration(frame: GameFrame): number | undefined {
  return getScheduled(frame).find((s: { id?: string }) =>
    s.id?.startsWith('core.random_images')
  )?.duration;
}

describe('getImageSwitchDuration', () => {
  it('should use the raw setting when intense images are off', () => {
    const settings = { imageDuration: 20, intenseImages: false };
    expect(getImageSwitchDuration(settings, 0)).toBe(20000);
    expect(getImageSwitchDuration(settings, 0.5)).toBe(20000);
    expect(getImageSwitchDuration(settings, 1)).toBe(20000);
  });

  it('should scale with intensity when intense images are on', () => {
    const settings = { imageDuration: 20, intenseImages: true };
    expect(getImageSwitchDuration(settings, 0)).toBe(20000);
    expect(getImageSwitchDuration(settings, 0.5)).toBe(10000);
  });

  it('should floor the scale at a tenth of the setting', () => {
    const settings = { imageDuration: 20, intenseImages: true };
    expect(getImageSwitchDuration(settings, 1)).toBe(2000);
    expect(getImageSwitchDuration(settings, 2)).toBe(2000);
  });

  it('should never schedule faster than a second', () => {
    const settings = { imageDuration: 5, intenseImages: true };
    expect(getImageSwitchDuration(settings, 1)).toBe(1000);
  });
});

describe('RandomImages scheduling', () => {
  it('should schedule the next switch from the image duration setting', () => {
    let frame = startImages({ imageDuration: 30, intenseImages: false });

    frame = withImpulse(RandomImages.start())(tick(frame, 0));
    frame = gamePipe(tick(frame, 0));
    frame = gamePipe(tick(frame, 0));

    expect(switchDuration(frame)).toBe(30000);
  });

  it('should shorten the switch as intensity rises', () => {
    let frame = startImages({ imageDuration: 20, intenseImages: true });
    frame = Composer.set(typedPath(['core.intensity']), { intensity: 0.75 })(
      frame
    );

    frame = withImpulse(RandomImages.start())(tick(frame, 0));
    frame = gamePipe(tick(frame, 0));
    frame = gamePipe(tick(frame, 0));

    expect(switchDuration(frame)).toBe(5000);
  });
});
