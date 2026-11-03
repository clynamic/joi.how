import { describe, it, expect } from 'vitest';
import { Composer } from '../../../src/engine/Composer';
import { Events } from '../../../src/engine/pipes/Events';
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame } from '../../../src/engine/State';
import { typedPath } from '../../../src/engine/Lens';
import Image from '../../../src/game/plugins/image';
import Scene from '../../../src/game/plugins/scene';
import Rand from '../../../src/game/plugins/rand';
import RandomImages, {
  getImageSwitchDuration,
} from '../../../src/game/plugins/randomImages';
import { defaults, makeFrame, makeGame, seed, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

function startImages(overrides?: Partial<typeof defaults>): GameFrame {
  let frame = gamePipe(makeFrame());

  frame = seed({
    ...defaults,
    images: ['local:a', 'local:b', 'local:c'],
    ...overrides,
  })(frame);
  frame = Composer.set(typedPath(['how.joi.classic.intensity']), {
    intensity: 0,
  })(frame);

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
    s.id?.startsWith('how.joi.classic.random_images')
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

  it('should treat a missing intensity as zero', () => {
    const settings = { imageDuration: 20, intenseImages: true };
    expect(getImageSwitchDuration(settings, undefined as never)).toBe(20000);
    expect(getImageSwitchDuration(settings, NaN)).toBe(20000);
  });

  it('should floor the raw setting at a second when intense images are off', () => {
    const settings = { imageDuration: 0, intenseImages: false };
    expect(getImageSwitchDuration(settings, 0)).toBe(1000);
  });

  it('should fall back to the default duration when the setting is missing', () => {
    const missing = {
      imageDuration: undefined as unknown as number,
      intenseImages: false,
    };
    const broken = { imageDuration: NaN, intenseImages: true };
    expect(getImageSwitchDuration(missing, 0)).toBe(20000);
    expect(getImageSwitchDuration(broken, 0)).toBe(20000);
  });

  it('should never schedule faster than a second', () => {
    const settings = { imageDuration: 5, intenseImages: true };
    expect(getImageSwitchDuration(settings, 1)).toBe(1000);
  });
});

describe('RandomImages lookahead', () => {
  const imageState = (frame: GameFrame) =>
    (frame as any)?.how?.joi?.classic?.image ?? {};

  it('should show the first image and keep three queued after the first switch', () => {
    let frame = withImpulse(RandomImages.start())(tick(startImages()));
    frame = gamePipe(tick(frame));
    frame = gamePipe(tick(frame));

    const { currentImage, nextImages } = imageState(frame);
    expect(['local:a', 'local:b', 'local:c']).toContain(currentImage);
    expect(nextImages).toHaveLength(3);
    expect(nextImages.slice(0, 2)).not.toContain(currentImage);
  });

  it('should advance through the queue on each switch', () => {
    let frame = withImpulse(RandomImages.start())(tick(startImages()));
    frame = gamePipe(tick(frame));
    frame = gamePipe(tick(frame));
    const first = imageState(frame);

    frame = withImpulse(
      Events.dispatch({ type: 'how.joi.classic.random_images/schedule_next' })
    )(tick(frame));
    frame = gamePipe(tick(frame));
    const second = imageState(frame);

    expect(second.currentImage).toBe(first.nextImages[0]);
    expect(second.nextImages).toHaveLength(3);
  });
});

describe('RandomImages on the game scene', () => {
  it('should queue images when the game scene is entered and stop switching when it is left', () => {
    let frame = startImages();
    frame = ModuleManager.load(Scene)(frame);
    frame = gamePipe(tick(frame));
    frame = withImpulse(Scene.setScene('game'))(tick(frame));
    for (let i = 0; i < 3; i++) frame = gamePipe(tick(frame));

    expect(frame.how.joi.classic.image.nextImages.length).toBeGreaterThan(0);
    expect(switchDuration(frame)).toBeDefined();

    frame = withImpulse(Scene.setScene('home'))(tick(frame));
    for (let i = 0; i < 3; i++) frame = gamePipe(tick(frame));

    expect(switchDuration(frame)).toBeUndefined();
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
    frame = Composer.set(typedPath(['how.joi.classic.intensity']), {
      intensity: 0.75,
    })(frame);

    frame = withImpulse(RandomImages.start())(tick(frame, 0));
    frame = gamePipe(tick(frame, 0));
    frame = gamePipe(tick(frame, 0));

    expect(switchDuration(frame)).toBe(5000);
  });
});
