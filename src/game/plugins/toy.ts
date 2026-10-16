import {
  ButtplugBrowserWebsocketClientConnector,
  ButtplugClient,
  type ButtplugClientDevice,
} from 'buttplug';
import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { Effects, type Inject } from '../../engine/pipes/Effects';
import { Scheduler } from '../../engine/pipes/Scheduler';
import { typedPath } from '../../engine/Lens';
import { Pipe } from '../../engine/State';
import { Settings } from '../../settings/Settings';
import { ToyClient } from '../../toy';
import { Sequence } from '../Sequence';
import Phase, { GamePhase, PhaseState } from './phase';
import Pause from './pause';
import { StrokeDirection, StrokeState } from './stroke';
import { PaceState } from './pace';
import { IntensityState } from './intensity';

const PLUGIN_ID = 'core.toy';

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
const settings = typedPath<Settings>(['settings']);
const phaseState = typedPath<PhaseState>(['core.phase']);
const strokeState = typedPath<StrokeState>(['core.stroke']);
const paceState = typedPath<PaceState>(['core.pace']);
const intensityState = typedPath<IntensityState>(['core.intensity']);

const seq = Sequence.for(PLUGIN_ID, 'climax');

const connect = Effects.define<{ url: string }>(PLUGIN_ID, 'connect');
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

const open = (url: string, inject: Inject) => {
  if (connecting || client) {
    snapshot(inject);
    return;
  }
  connecting = true;
  const next = new ButtplugClient('JOI.how');
  next
    .connect(new ButtplugBrowserWebsocketClientConnector(url))
    .then(() => next.startScanning())
    .then(() => {
      client = next;
      connection = url;
      toys = next.devices.map(device => new ToyClient(device));
      attach(next, inject);
    })
    .catch(error => {
      next.disconnect().catch(() => undefined);
      report(inject)(error);
    })
    .finally(() => {
      connecting = false;
      snapshot(inject);
    });
};

const close = (inject: Inject) => {
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
      maxPace: get(settings)?.maxPace ?? 1,
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

const Toy = definePlugin({
  name: 'Toy',
  id: PLUGIN_ID,
  meta: {
    name: 'Toy',
  },

  paths: toy,

  devices(): ToyClient[] {
    return toys;
  },

  connect(url: string): Pipe {
    return Composer.pipe(
      Composer.set(toy.error, undefined),
      Composer.set(toy.connecting, true),
      connect.emit({ url })
    );
  },

  disconnect(): Pipe {
    return disconnect.emit();
  },

  activate: Composer.pipe(
    Composer.set(toy, { toys: [], connecting: false }),
    sync.emit()
  ),

  update: Composer.pipe(
    Pause.whenPlaying(actuatePipe),
    Phase.onEnter(GamePhase.climax, () => seq.start()),
    Phase.onEnter(GamePhase.break, hush),
    seq.on(() => ramp(0)),
    seq.on<{ step: number }>('step', event => ramp(event.payload.step)),
    Pause.onPause(() =>
      Composer.pipe(Scheduler.holdByPrefix(PLUGIN_ID), stop.emit())
    ),
    Pause.onResume(() => Scheduler.releaseByPrefix(PLUGIN_ID))
  ),

  deactivate: Composer.pipe(
    stop.emit(),
    disconnect.emit(),
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
