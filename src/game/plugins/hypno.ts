import type { Plugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { pluginPaths } from '../../engine/plugins/Plugins';
import { typedPath } from '../../engine/Lens';
import { GameTiming } from '../../engine/State';
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
const timing = typedPath<GameTiming>([]);
const phaseState = typedPath<PhaseState>(['core.phase']);
const intensityState = typedPath<IntensityState>(['core.intensity']);
const settings = typedPath<Settings>(['settings']);

export default class Hypno {
  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'Hypno',
    },

    activate: Composer.set(hypno, {
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

        const delta = get(timing.step);
        const state = get(hypno);
        const elapsed = state.timer + delta;
        if (elapsed < delay) {
          set(hypno.timer, elapsed);
          return;
        }

        const phrases = HypnoPhrases[s.hypno];
        if (phrases.length <= 0) return;

        pipe(
          Rand.nextInt(phrases.length, idx =>
            Composer.set(hypno, {
              currentPhrase: idx,
              timer: 0,
            })
          )
        );
      })
    ),

    deactivate: Composer.set(hypno, undefined),
  };

  static get paths() {
    return hypno;
  }
}
