import type { Plugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { pluginPaths } from '../../engine/plugins/Plugins';
import { typedPath } from '../../engine/Lens';
import { GameContext } from '../../engine';
import { PhaseState, GamePhase } from './phase';
import Pause from './pause';
import { PaceState } from './pace';

declare module '../../engine/sdk' {
  interface PluginSDK {
    Stroke: typeof Stroke;
  }
}

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
const gameContext = typedPath<GameContext>(['context']);
const phaseState = typedPath<PhaseState>(['state', 'core.phase']);
const paceState = typedPath<PaceState>(['state', 'core.pace']);

export default class Stroke {
  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Stroke',
    },

    activate: Composer.set(stroke.state, {
      stroke: StrokeDirection.up,
      timer: 0,
    }),

    update: Pause.whenPlaying(
      Composer.do(({ get, set }) => {
        const phase = get(phaseState)?.current;
        if (phase !== GamePhase.active && phase !== GamePhase.finale) return;

        const pace = get(paceState)?.pace;
        if (!pace || pace <= 0) return;

        const delta = get(gameContext.deltaTime);
        const state = get(stroke.state);
        if (!state) return;

        const interval = (1 / pace) * 1000;
        const elapsed = state.timer + delta;

        if (elapsed >= interval) {
          set(stroke.state, {
            stroke:
              state.stroke === StrokeDirection.up
                ? StrokeDirection.down
                : StrokeDirection.up,
            timer: elapsed - interval,
          });
        } else {
          set(stroke.state.timer, elapsed);
        }
      })
    ),

    deactivate: Composer.set(stroke.state, undefined),
  };

  static get paths() {
    return stroke;
  }
}
