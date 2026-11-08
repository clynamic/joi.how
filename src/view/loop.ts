import { GameEngine } from '../engine/Engine';
import { Frames } from '../engine/Frames';
import { Impulses } from '../engine/Impulses';
import {
  ModuleManager,
  moduleManagerPipe,
} from '../engine/modules/ModuleManager';
import { Effects } from '../engine/pipes/Effects';
import { Perf } from '../engine/pipes/Perf';
import { Piper } from '../engine/Piper';
import { sdk } from '../engine/sdk';
import { Pipe } from '../engine/State';
import { gamePipes, registerPlugins } from '../game';
import Debug from '../game/debug/overlay';

const STEP = 16;
const MAX_TICKS_PER_FRAME = 4;

export const startLoop = (extra: Pipe[] = []): (() => void) => {
  const impulses = new Impulses();
  const engine = new GameEngine(
    {},
    Piper(gamePipes(impulses, [moduleManagerPipe, registerPlugins, ...extra]))
  );

  const inject = (pipe: Pipe) => impulses.push(pipe);
  sdk.inject = inject;
  sdk.frame = () => engine.getFrame();

  const engineTypes = new Set(Effects.engineTypes());
  const observe = (module: string, type: string, duration: number) => {
    if (engineTypes.has(type)) return;
    inject(Perf.record(module, `perform ${type.split('/').pop()}`, duration));
  };

  let speed = 1;
  impulses.push(
    ModuleManager.load({
      id: 'app.loop',
      effects: [
        Debug.speed.perform(({ factor }) => {
          speed = Number.isFinite(factor) && factor > 0 ? factor : 1;
        }),
      ],
    })
  );

  let accumulator = 0;
  let lastWallTime: number | null = null;
  let frameId = 0;

  const loop = () => {
    const now = performance.now();

    if (document.hidden || lastWallTime === null) {
      lastWallTime = now;
      frameId = requestAnimationFrame(loop);
      return;
    }

    accumulator += (now - lastWallTime) * speed;
    lastWallTime = now;

    let ticked = false;
    let ticks = 0;
    const maxTicks = MAX_TICKS_PER_FRAME * speed;

    while (accumulator >= STEP && ticks < maxTicks) {
      ticked = true;
      Effects.flush(engine.tick(), inject, sdk.debug ? observe : undefined);
      accumulator -= STEP;
      ticks++;
    }

    if (ticks >= maxTicks) {
      accumulator = 0;
    }

    if (ticked) {
      Frames.publish(engine.getFrame());
    }

    frameId = requestAnimationFrame(loop);
  };

  frameId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(frameId);
    sdk.inject = () => undefined;
    sdk.frame = () => null;
    impulses.clear();
  };
};
