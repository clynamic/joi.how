import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { typedPath } from '../../engine/Lens';
import { Events } from '../../engine/pipes/Events';
import { GameTiming, Pipe } from '../../engine/State';
import { PhaseState, GamePhase } from './phase';
import Pause from './pause';
import { PaceState } from './pace';

const PLUGIN_ID = 'core.stroke';

export enum StrokeDirection {
  up = 'up',
  down = 'down',
}

export type StrokeState = {
  stroke: StrokeDirection;
  timer: number;
};

const stroke = pluginPaths<StrokeState>(PLUGIN_ID);
const timing = typedPath<GameTiming>([]);
const phaseState = typedPath<PhaseState>(['core.phase']);
const paceState = typedPath<PaceState>(['core.pace']);

const flipped = Events.define<StrokeDirection>(PLUGIN_ID, 'flipped');

const Stroke = definePlugin({
  sdk: 'Stroke',
  id: PLUGIN_ID,
  meta: {
    name: 'Stroke',
  },

  onFlip(fn: (stroke: StrokeDirection) => Pipe): Pipe {
    return flipped.handle(event => fn(event.payload));
  },

  activate: Composer.set(stroke, {
    stroke: StrokeDirection.up,
    timer: 0,
  }),

  update: Pause.whenPlaying(
    Composer.do(({ get, set, pipe }) => {
      const phase = get(phaseState)?.current;
      if (phase !== GamePhase.active && phase !== GamePhase.finale) return;

      const pace = get(paceState)?.pace;
      if (!pace || pace <= 0) return;

      const delta = get(timing.step);
      const state = get(stroke);
      if (!state) return;

      const interval = (1 / pace) * 1000;
      const elapsed = state.timer + delta;

      if (elapsed >= interval) {
        const next =
          state.stroke === StrokeDirection.up
            ? StrokeDirection.down
            : StrokeDirection.up;
        set(stroke, { stroke: next, timer: elapsed - interval });
        pipe(flipped.dispatch(next));
      } else {
        set(stroke.timer, elapsed);
      }
    })
  ),

  deactivate: Composer.set(stroke, undefined),

  get paths() {
    return stroke;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Stroke: typeof Stroke;
  }
}

export default Stroke;
