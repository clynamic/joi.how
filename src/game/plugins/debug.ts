import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine';
import { Effects } from '../../engine/pipes/Effects';
import { sdk } from '../../engine/sdk';
import type { Pipe } from '../../engine/State';
import Keys from './keys';

const PLUGIN_ID = 'core.debug';
const TOGGLE_KEY = 'F3';
const FASTER_KEYS = ['+', '='];
const SLOWER_KEYS = ['-', '_'];
const MAX_SPEED = 16;

type DebugState = {
  visible: boolean;
  speed: number;
};

const debug = pluginPaths<DebugState>(PLUGIN_ID);

const speed = Effects.define<{ factor: number }>(PLUGIN_ID, 'speed');

const clampSpeed = (factor: number) =>
  Math.min(MAX_SPEED, Math.max(1, Math.round(factor)));

const toggle = (): Pipe =>
  Composer.do(({ get, set }) => {
    const state = get(debug);
    if (!state) return;
    sdk.debug = !state.visible;
    set(debug.visible, !state.visible);
  });

const setSpeed = (factor: number): Pipe =>
  Composer.do(({ get, set, pipe }) => {
    const state = get(debug);
    if (!state) return;
    const next = clampSpeed(factor);
    if (next === state.speed) return;
    set(debug.speed, next);
    pipe(speed.emit({ factor: next }));
  });

const faster = (): Pipe =>
  Composer.bind(debug, state => setSpeed((state?.speed ?? 1) * 2));

const slower = (): Pipe =>
  Composer.bind(debug, state => setSpeed((state?.speed ?? 1) / 2));

const whenVisible = (pipe: Pipe): Pipe =>
  Composer.bind(debug, state => Composer.when(!!state?.visible, pipe));

const Debug = definePlugin({
  id: PLUGIN_ID,
  meta: {
    name: 'Debug',
  },

  paths: debug,

  speed,

  toggle,

  setSpeed,

  faster,

  slower,

  whenDebug:
    (pipe: Pipe): Pipe =>
    frame =>
      sdk.debug ? pipe(frame) : frame,

  whenVisible,

  activate: Composer.pipe(
    Composer.do(({ set }) => {
      sdk.debug = false;
      set(debug, { visible: false, speed: 1 });
    }),
    Keys.capture(TOGGLE_KEY)
  ),

  update: Composer.pipe(
    Keys.onKey(TOGGLE_KEY, () => toggle()),
    Keys.onKey(FASTER_KEYS, () => whenVisible(faster())),
    Keys.onKey(SLOWER_KEYS, () => whenVisible(slower()))
  ),

  deactivate: Composer.pipe(
    Keys.release(TOGGLE_KEY),
    speed.emit({ factor: 1 }),
    Composer.do(({ set }) => {
      sdk.debug = false;
      set(debug, undefined);
    })
  ),
});

export default Debug;
