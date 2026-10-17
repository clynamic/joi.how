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
import { ModuleManager } from '../../../src/engine/modules/ModuleManager';
import { GameFrame, Pipe } from '../../../src/engine/State';
import Pause from '../../../src/game/plugins/pause';
import Phase from '../../../src/game/plugins/phase';
import Toy from '../../../src/game/plugins/toy';
import Storage from '../../../src/engine/plugins/Storage';
import { makeFrame, makeGame, tick } from '../../utils';

const { pipe: gamePipe, withImpulse } = makeGame();

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

async function flushAndApply(frame: GameFrame): Promise<GameFrame> {
  const injected: Pipe[] = [];
  Effects.flush(frame, pipe => injected.push(pipe));
  await settle();
  return withImpulse(Composer.pipe(...injected))(tick(frame));
}

function bootstrap(): GameFrame {
  let frame = gamePipe(makeFrame());
  for (const plugin of [Storage, Pause, Phase, Toy]) {
    frame = ModuleManager.load(plugin)(frame);
  }
  frame = gamePipe(tick(frame));
  return gamePipe(tick(frame));
}

describe('Toy performers', () => {
  beforeEach(() => {
    localStorage.clear();
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

  it('should keep the connection across an unload and report it on the next activate', async () => {
    let frame = await flushAndApply(
      Toy.connect('ws://127.0.0.1:12345')(bootstrap())
    );

    frame = await flushAndApply(ModuleManager.unload(Toy.id)(frame));
    frame = await flushAndApply(frame);
    frame = await flushAndApply(ModuleManager.load(Toy)(frame));
    frame = await flushAndApply(frame);

    expect(fake.state.instances).toHaveLength(1);
    expect(frame.core.toy).toMatchObject({
      connection: 'ws://127.0.0.1:12345',
      toys: [{ name: 'Fake Wand' }],
    });
  });

  it('should remember the address once connected and forget it on disconnect', async () => {
    let frame = await flushAndApply(
      Toy.connect('ws://127.0.0.1:12345')(bootstrap())
    );
    frame = await flushAndApply(frame);
    const remembered = localStorage.getItem('core.toy.connection');

    frame = await flushAndApply(Toy.disconnect()(frame));
    await flushAndApply(frame);

    expect(remembered).toBe('"ws://127.0.0.1:12345"');
    expect(localStorage.getItem('core.toy.connection')).toBeNull();
  });

  it('should connect at boot to a remembered address', async () => {
    localStorage.setItem('core.toy.connection', '"ws://127.0.0.1:12345"');

    let frame = gamePipe(makeFrame());
    for (const plugin of [Storage, Pause, Phase, Toy]) {
      frame = ModuleManager.load(plugin)(frame);
    }
    frame = gamePipe(tick(frame));
    for (let i = 0; i < 4; i++) frame = await flushAndApply(frame);

    expect(fake.state.instances).toHaveLength(1);
    expect(frame.core.toy.connection).toBe('ws://127.0.0.1:12345');
  });

  it('should forget a remembered address that refuses the connection', async () => {
    localStorage.setItem('core.toy.connection', '"ws://127.0.0.1:12345"');
    fake.state.connectShouldFail = true;

    let frame = gamePipe(makeFrame());
    for (const plugin of [Storage, Pause, Phase, Toy]) {
      frame = ModuleManager.load(plugin)(frame);
    }
    frame = gamePipe(tick(frame));
    for (let i = 0; i < 5; i++) frame = await flushAndApply(frame);

    expect(frame.core.toy.error).toContain('refused');
    expect(localStorage.getItem('core.toy.connection')).toBeNull();
  });

  it('should forget the address on disconnect without a live client', async () => {
    let frame = bootstrap();
    for (let i = 0; i < 3; i++) frame = await flushAndApply(frame);
    localStorage.setItem('core.toy.connection', '"ws://127.0.0.1:12345"');

    frame = await flushAndApply(Toy.disconnect()(frame));
    await flushAndApply(frame);

    expect(fake.state.instances).toHaveLength(0);
    expect(localStorage.getItem('core.toy.connection')).toBeNull();
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
    frame = Composer.set(Pause.paths.paused, false)(frame);
    for (let i = 0; i < 4; i++) frame = await flushAndApply(frame);
    expect(fake.device.stop).not.toHaveBeenCalled();

    frame = Pause.setPaused(true)(frame);
    for (let i = 0; i < 6; i++) frame = await flushAndApply(frame);
    expect(fake.device.stop).toHaveBeenCalled();

    frame = await flushAndApply(Toy.disconnect()(frame));

    expect(frame.core.toy.connection).toBeUndefined();
    expect(frame.core.toy.toys).toEqual([]);
    expect(Toy.devices()).toEqual([]);
  });
});
