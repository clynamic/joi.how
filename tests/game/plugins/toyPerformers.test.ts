import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const fake = vi.hoisted(() => {
  const device = {
    name: 'Fake Wand',
    index: 7,
    vibrateAttributes: [] as unknown[],
    linearAttributes: [] as unknown[],
    oscillateAttributes: [] as unknown[],
    rotateAttributes: [] as unknown[],
    stop: vi.fn(async () => undefined),
    vibrate: vi.fn(async () => undefined),
    linear: vi.fn(async () => undefined),
    oscillate: vi.fn(async () => undefined),
  };
  const state = { connectShouldFail: false, instances: [] as unknown[] };
  class ButtplugClient {
    devices = [device];
    listeners = new Map<string, (...args: unknown[]) => void>();
    constructor(public name: string) {
      state.instances.push(this);
    }
    async connect() {
      if (state.connectShouldFail) throw new Error('refused');
    }
    async startScanning() {}
    async disconnect() {}
    addListener(name: string, fn: (...args: unknown[]) => void) {
      this.listeners.set(name, fn);
    }
    removeListener(name: string) {
      this.listeners.delete(name);
    }
  }
  class ButtplugBrowserWebsocketClientConnector {
    constructor(public url: string) {}
  }
  return {
    device,
    state,
    ButtplugClient,
    ButtplugBrowserWebsocketClientConnector,
  };
});

vi.mock('buttplug', async importOriginal => ({
  ...(await importOriginal<typeof import('buttplug')>()),
  ButtplugClient: fake.ButtplugClient,
  ButtplugBrowserWebsocketClientConnector:
    fake.ButtplugBrowserWebsocketClientConnector,
}));

import { Composer } from '../../../src/engine/Composer';
import { Effects } from '../../../src/engine/pipes/Effects';
import { Events } from '../../../src/engine/pipes/Events';
import { Scheduler } from '../../../src/engine/pipes/Scheduler';
import {
  ModuleManager,
  moduleManagerPipe,
} from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Pause from '../../../src/game/plugins/pause';
import Phase from '../../../src/game/plugins/phase';
import Toy from '../../../src/game/plugins/toy';
import { makeFrame, tick } from '../../utils';

const gamePipe: Pipe = Composer.pipe(
  Effects.pipe,
  Events.pipe,
  Scheduler.pipe,
  moduleManagerPipe
);

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

async function flushAndApply(frame: GameFrame): Promise<GameFrame> {
  const injected: Pipe[] = [];
  Effects.flush(frame, pipe => injected.push(pipe));
  await settle();
  return Composer.pipe(
    Effects.pipe,
    ...injected,
    Events.pipe,
    Scheduler.pipe,
    moduleManagerPipe
  )(tick(frame));
}

function bootstrap(): GameFrame {
  let frame = gamePipe(makeFrame());
  for (const plugin of [Pause, Phase, Toy]) {
    frame = ModuleManager.load(plugin)(frame);
  }
  frame = gamePipe(tick(frame));
  return gamePipe(tick(frame));
}

describe('Toy performers', () => {
  beforeEach(() => {
    fake.state.connectShouldFail = false;
    fake.state.instances = [];
    fake.device.stop.mockClear();
  });
  afterEach(async () => {
    await flushAndApply(Toy.disconnect()(bootstrap()));
  });

  it('should connect, report the connection and list the devices', async () => {
    let frame = Toy.connect('ws://127.0.0.1:12345')(bootstrap());
    expect(frame.core.toy.connecting).toBe(true);

    frame = await flushAndApply(frame);

    expect(frame.core.toy).toMatchObject({
      connection: 'ws://127.0.0.1:12345',
      connecting: false,
      toys: [{ name: 'Fake Wand', actuators: [] }],
    });
    expect(Toy.devices()).toHaveLength(1);
    expect(fake.state.instances).toHaveLength(1);
  });

  it('should report a refused connection as an error', async () => {
    fake.state.connectShouldFail = true;
    let frame = Toy.connect('ws://127.0.0.1:12345')(bootstrap());

    frame = await flushAndApply(frame);

    expect(frame.core.toy.connecting).toBe(false);
    expect(frame.core.toy.connection).toBeUndefined();
    expect(frame.core.toy.error).toContain('refused');
  });

  it('should stop every device on a stop effect and clear on disconnect', async () => {
    let frame = await flushAndApply(Toy.connect('ws://x')(bootstrap()));

    frame = await flushAndApply(Pause.setPaused(true)(frame));
    frame = await flushAndApply(frame);
    expect(fake.device.stop).toHaveBeenCalled();

    frame = await flushAndApply(Toy.disconnect()(frame));

    expect(frame.core.toy.connection).toBeUndefined();
    expect(frame.core.toy.toys).toEqual([]);
    expect(Toy.devices()).toEqual([]);
  });
});
