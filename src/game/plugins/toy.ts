import {
  ButtplugBrowserWebsocketClientConnector,
  ButtplugClient,
  type ButtplugClientDevice,
} from 'buttplug';
import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
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

const toy = pluginPaths<ToyState>(PLUGIN_ID);
const settings = typedPath<Settings>(['settings']);
const phaseState = typedPath<PhaseState>(['core.phase']);
const strokeState = typedPath<StrokeState>(['core.stroke']);
const paceState = typedPath<PaceState>(['core.pace']);
const intensityState = typedPath<IntensityState>(['core.intensity']);

const seq = Sequence.for(PLUGIN_ID, 'climax');

let client: ButtplugClient | null = null;
let toys: ToyClient[] = [];
let connection: string | null = null;
let failure: string | null = null;
let connecting = false;
let dirty = false;

const describe = (list: ToyClient[]): ToyInfo[] =>
  list.map(t => ({
    name: t.name,
    index: t.index,
    actuators: t.actuators.map(a => ({
      index: a.index,
      actuatorType: String(a.actuatorType),
    })),
  }));

const report = (error: unknown) => {
  failure = String(error);
  dirty = true;
};

const detach = (target: ButtplugClient) => {
  target.removeListener('deviceadded');
  target.removeListener('deviceremoved');
  target.removeListener('disconnect');
};

const attach = (target: ButtplugClient) => {
  target.addListener('deviceadded', (device: ButtplugClientDevice) => {
    toys = [...toys, new ToyClient(device)];
    dirty = true;
  });
  target.addListener('deviceremoved', (device: ButtplugClientDevice) => {
    toys = toys.filter(t => t.deviceIndex !== device.index);
    dirty = true;
  });
  target.addListener('disconnect', () => {
    detach(target);
    client = null;
    connection = null;
    toys = [];
    dirty = true;
  });
};

const open = (url: string) => {
  if (connecting || client) return;
  connecting = true;
  dirty = true;
  const next = new ButtplugClient('JOI.how');
  next
    .connect(new ButtplugBrowserWebsocketClientConnector(url))
    .then(() => next.startScanning())
    .then(() => {
      client = next;
      connection = url;
      toys = next.devices.map(device => new ToyClient(device));
      attach(next);
    })
    .catch(error => {
      next.disconnect().catch(() => undefined);
      report(error);
    })
    .finally(() => {
      connecting = false;
      dirty = true;
    });
};

const close = () => {
  const current = client;
  if (!current) return;
  detach(current);
  client = null;
  connection = null;
  toys = [];
  dirty = true;
  current.disconnect().catch(report);
};

const silence = () => {
  toys.forEach(t => t.stop().catch(report));
};

const drain: Pipe = Composer.do(({ get, set }) => {
  if (!dirty) return;
  dirty = false;
  set(toy, {
    connection: connection ?? undefined,
    error: failure ?? undefined,
    connecting,
    toys: describe(toys),
    stroke: get(toy)?.stroke,
  });
  failure = null;
});

const actuate: Pipe = Composer.do(({ get, set }) => {
  if (toys.length === 0) return;

  const stroke = get(strokeState)?.stroke;
  if (!stroke) return;

  const state = get(toy);
  if (!state || state.stroke === stroke) return;

  set(toy.stroke, stroke);

  const phase = get(phaseState)?.current;
  if (phase !== GamePhase.active && phase !== GamePhase.finale) return;

  const intensity = (get(intensityState)?.intensity ?? 0) * 100;
  const pace = get(paceState)?.pace ?? 1;
  const maxPace = get(settings)?.maxPace ?? 1;

  toys.forEach(t => t.actuate(stroke, intensity, pace, maxPace).catch(report));
});

const ramp = (step: number): Pipe =>
  Composer.do(({ pipe }) => {
    if (step >= CLIMAX_STEPS) {
      silence();
      return;
    }
    const strength = Math.max(0, 1 - step * CLIMAX_FALLOFF);
    toys.forEach(t => t.setVibration(strength).catch(report));
    pipe(seq.after(CLIMAX_INTERVAL, 'step', { step: step + 1 }));
  });

const quiet = (): Pipe => Composer.do(() => silence());

const hush = (): Pipe =>
  Composer.do(({ pipe }) => {
    silence();
    pipe(seq.cancel());
  });

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
      Composer.do(() => open(url))
    );
  },

  disconnect(): Pipe {
    return Composer.do(() => close());
  },

  activate: Composer.do(({ set }) => {
    set(toy, { toys: describe(toys), connection: connection ?? undefined });
  }),

  update: Composer.pipe(
    drain,
    Pause.whenPlaying(actuate),
    Phase.onEnter(GamePhase.climax, () => seq.start()),
    Phase.onEnter(GamePhase.break, hush),
    seq.on(() => ramp(0)),
    seq.on<{ step: number }>('step', event => ramp(event.payload.step)),
    Pause.onPause(() =>
      Composer.pipe(Scheduler.holdByPrefix(PLUGIN_ID), quiet())
    ),
    Pause.onResume(() => Scheduler.releaseByPrefix(PLUGIN_ID))
  ),

  deactivate: Composer.pipe(
    Composer.do(({ pipe }) => {
      silence();
      close();
      pipe(seq.cancel());
    }),
    Composer.set(toy, undefined)
  ),
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Toy: typeof Toy;
  }
}

export default Toy;
