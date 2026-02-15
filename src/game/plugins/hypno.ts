import type { Plugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { pluginPaths } from '../../engine/plugins/Plugins';
import { typedPath } from '../../engine/Lens';
import { GameContext } from '../../engine';
import { GamePhase, PhaseState } from './phase';
import Pause from './pause';
import { IntensityState } from './intensity';
import { Settings } from '../../settings';
import { GameHypnoType, HypnoPhrases } from '../../types';
import Rand from './rand';

const PLUGIN_ID = 'core.hypno';

export type HypnoState = {
  currentPhrase: number;
  timer: number;
};

const hypno = pluginPaths<HypnoState>(PLUGIN_ID);
const gameContext = typedPath<GameContext>(['context']);
const phaseState = typedPath<PhaseState>(['state', 'core.phase']);
const intensityState = typedPath<IntensityState>(['state', 'core.intensity']);
const settings = typedPath<Settings>(['context', 'settings']);

export default class Hypno {
  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Hypno',
    },

    activate: Composer.set(hypno.state, {
      currentPhrase: 0,
      timer: 0,
    }),

    update: Pause.whenPlaying(
      Composer.do(({ get, set, pipe }) => {
        const phase = get(phaseState).current;
        if (phase !== GamePhase.active) return;

        const s = get(settings);
        if (s.hypno === GameHypnoType.off) return;

        const i = get(intensityState).intensity * 100;
        const delay = 3000 - i * 29;
        if (delay <= 0) return;

        const delta = get(gameContext.step);
        const state = get(hypno.state);
        const elapsed = state.timer + delta;
        if (elapsed < delay) {
          set(hypno.state.timer, elapsed);
          return;
        }

        const phrases = HypnoPhrases[s.hypno];
        if (phrases.length <= 0) return;

        pipe(
          Rand.nextInt(phrases.length, idx =>
            Composer.set(hypno.state, {
              currentPhrase: idx,
              timer: 0,
            })
          )
        );
      })
    ),

    deactivate: Composer.set(hypno.state, undefined),
  };

  static get paths() {
    return hypno;
  }
}
