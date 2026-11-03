import {
  ButtplugBrowserWebsocketClientConnector,
  ButtplugClient,
  type ButtplugClientDevice,
} from 'buttplug';
import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { Effects, type Inject } from '../../engine/pipes/Effects';
import { Requests } from '../../engine/pipes/Requests';
import { Scheduler } from '../../engine/pipes/Scheduler';
import { typedPath } from '../../engine/Lens';
import { GameFrame, Pipe } from '../../engine/State';
import { ToyClient } from './client';
import { Sequence } from '../Sequence';
import Storage from '../../engine/plugins/Storage';
import { PLAY_TIMELINE } from '../timelines';
import Phase, { GamePhase, PhaseState } from '../phase';
import Pause from '../pause';
import { StrokeState, StrokeDirection } from '../classic/stroke';
import Pace, { PaceState } from '../classic/pace';
import { IntensityState } from '../classic/intensity';

const PLUGIN_ID = 'how.joi.toy';

const CLIMAX_STEPS = 15;
const CLIMAX_INTERVAL = 400;
const CLIMAX_FALLOFF = 0.067;

export type ToyActuatorInfo = {
  index: number;
  actuatorType: string;
};

export type ToyInfo = {
  name: string;
  index: number;
  actuators: ToyActuatorInfo[];
};

export type ToyState = {
  connection?: string;
  error?: string;
  connecting?: boolean;
  toys: ToyInfo[];
  stroke?: StrokeDirection;
};

export type ActuatePayload = {
  stroke: StrokeDirection;
  intensity: number;
  pace: number;
  maxPace: number;
};

const toy = pluginPaths<ToyState>(PLUGIN_ID);
const phaseState = typedPath<PhaseState>(['how.joi.phase']);
const strokeState = typedPath<StrokeState>(['how.joi.classic.stroke']);
const paceState = typedPath<PaceState>(['how.joi.classic.pace']);
const intensityState = typedPath<IntensityState>(['how.joi.classic.intensity']);

const seq = Sequence.for(PLUGIN_ID, 'climax');

const connect = Requests.define<
  { url: string },
  { url: string; toys: ToyInfo[] }
>(PLUGIN_ID, 'connect');
const disconnect = Effects.define(PLUGIN_ID, 'disconnect');
const sync = Effects.define(PLUGIN_ID, 'sync');
const actuate = Effects.define<ActuatePayload>(PLUGIN_ID, 'actuate');
const vibration = Effects.define<{ strength: number }>(PLUGIN_ID, 'vibration');
const stop = Effects.define(PLUGIN_ID, 'stop');

let client: ButtplugClient | null = null;
let toys: ToyClient[] = [];
let connection: string | null = null;
let connecting = false;

const describe = (list: ToyClient[]): ToyInfo[] =>
  list.map(t => ({
    name: t.name,
    index: t.index,
    actuators: t.actuators.map(a => ({
      index: a.index,
      actuatorType: String(a.actuatorType),
    })),
  }));

const CONNECTION_KEY = `${PLUGIN_ID}.connection`;

const snapshot = (inject: Inject) =>
  inject(
    Composer.do(({ get, set }) => {
      const state = get(toy);
      if (!state) return;
      set(toy, {
        ...state,
        connection: connection ?? undefined,
        connecting,
        toys: describe(toys),
      });
    })
  );

const report = (inject: Inject) => (error: unknown) =>
  inject(
    Composer.do(({ get, set }) => {
      if (!get(toy)) return;
      set(toy.error, String(error));
    })
  );

const detach = (target: ButtplugClient) => {
  target.removeListener('deviceadded');
  target.removeListener('deviceremoved');
  target.removeListener('disconnect');
};

const attach = (target: ButtplugClient, inject: Inject) => {
  target.addListener('deviceadded', (device: ButtplugClientDevice) => {
    toys = [...toys, new ToyClient(device)];
    snapshot(inject);
  });
  target.addListener('deviceremoved', (device: ButtplugClientDevice) => {
    toys = toys.filter(t => t.deviceIndex !== device.index);
    snapshot(inject);
  });
  target.addListener('disconnect', () => {
    detach(target);
    client = null;
    connection = null;
    toys = [];
    snapshot(inject);
  });
};

const open = async (
  url: string,
  inject: Inject
): Promise<{ url: string; toys: ToyInfo[] }> => {
  if (client) return { url: connection ?? url, toys: describe(toys) };
  if (connecting) throw new Error('already connecting');
  connecting = true;
  const next = new ButtplugClient('JOI.how');
  try {
    await next.connect(new ButtplugBrowserWebsocketClientConnector(url));
    await next.startScanning();
    client = next;
    connection = url;
    toys = next.devices.map(device => new ToyClient(device));
    attach(next, inject);
    return { url, toys: describe(toys) };
  } catch (error) {
    next.disconnect().catch(() => undefined);
    throw error;
  } finally {
    connecting = false;
  }
};

const close = (inject: Inject) => {
  inject(Storage.remove(CONNECTION_KEY));
  const current = client;
  if (!current) return;
  detach(current);
  client = null;
  connection = null;
  toys = [];
  snapshot(inject);
  current.disconnect().catch(report(inject));
};

const actuatePipe: Pipe = Composer.do(({ get, set, pipe }) => {
  const state = get(toy);
  if (!state || state.toys.length === 0) return;

  const stroke = get(strokeState)?.stroke;
  if (!stroke || state.stroke === stroke) return;

  set(toy.stroke, stroke);

  const phase = get(phaseState)?.current;
  if (phase !== GamePhase.active && phase !== GamePhase.finale) return;

  pipe(
    actuate.emit({
      stroke,
      intensity: (get(intensityState)?.intensity ?? 0) * 100,
      pace: get(paceState)?.pace ?? 1,
      maxPace: Pace.bounds(get()).max,
    })
  );
});

const ramp = (step: number): Pipe => {
  if (step >= CLIMAX_STEPS) return stop.emit();
  return Composer.pipe(
    vibration.emit({ strength: Math.max(0, 1 - step * CLIMAX_FALLOFF) }),
    seq.after(CLIMAX_INTERVAL, 'step', { step: step + 1 })
  );
};

const hush = (): Pipe => Composer.pipe(stop.emit(), seq.cancel());

const startConnect = (url: string): Pipe =>
  Composer.do<GameFrame>(({ get, set, pipe }) => {
    if (!get(toy)) return;
    set(toy.error, undefined);
    set(toy.connecting, true);
    pipe(connect.start({ url }));
  });

const Toy = definePlugin({
  sdk: 'Toy',
  id: PLUGIN_ID,
  meta: {
    name: 'Toy',
  },

  paths: toy,

  devices(): ToyClient[] {
    return toys;
  },

  connect(url: string): Pipe {
    return startConnect(url);
  },

  disconnect(): Pipe {
    return Composer.do(({ get, set, pipe }) => {
      if (!get(toy)) return;
      set(toy.error, undefined);
      pipe(disconnect.emit());
    });
  },

  activate: Composer.pipe(
    Composer.set(toy, { toys: [], connecting: false }),
    sync.emit(),
    Storage.read(CONNECTION_KEY)
  ),

  update: Composer.pipe(
    Storage.onRead(CONNECTION_KEY, url =>
      typeof url === 'string' ? startConnect(url) : frame => frame
    ),
    connect.onDone(({ url, toys: list }) =>
      Composer.do(({ get, set, pipe }) => {
        if (!get(toy)) return;
        set(toy.connection, url);
        set(toy.connecting, false);
        set(toy.toys, list);
        pipe(Storage.write(CONNECTION_KEY, url));
      })
    ),
    connect.onFailed(reason =>
      Composer.do(({ get, set, pipe }) => {
        if (!get(toy)) return;
        set(toy.connecting, false);
        set(toy.error, reason);
        pipe(Storage.remove(CONNECTION_KEY));
      })
    ),
    Pause.whenPlaying(actuatePipe),
    Phase.onEnter(GamePhase.climax, () => seq.start()),
    Phase.onEnter(GamePhase.break, hush),
    seq.on(() => ramp(0)),
    seq.on<{ step: number }>('step', event => ramp(event.payload.step)),
    Scheduler.onStop(PLAY_TIMELINE, () => stop.emit())
  ),

  deactivate: Composer.pipe(
    stop.emit(),
    seq.cancel(),
    Composer.set(toy, undefined)
  ),

  effects: [
    connect.perform(({ url }, inject) => open(url, inject)),
    disconnect.perform((_, inject) => close(inject)),
    sync.perform((_, inject) => snapshot(inject)),
    actuate.perform(({ stroke, intensity, pace, maxPace }, inject) =>
      toys.forEach(t =>
        t.actuate(stroke, intensity, pace, maxPace).catch(report(inject))
      )
    ),
    vibration.perform(({ strength }, inject) =>
      toys.forEach(t => t.setVibration(strength).catch(report(inject)))
    ),
    stop.perform((_, inject) =>
      toys.forEach(t => t.stop().catch(report(inject)))
    ),
  ],
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Toy: typeof Toy;
  }
}

export default Toy;
