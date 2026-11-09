import { definePlugin, pluginPaths } from '../../../engine/plugins/Plugins';
import { Composer } from '../../../engine/Composer';
import { typedPath } from '../../../engine/Lens';
import { GameTiming } from '../../../engine/State';
import { GamePhase, PhaseState } from '../../phase';
import Pause from '../../pause';
import { IntensityState } from '../intensity';
import Presets from '../../presets';

import Rand from '../../rand';

export enum GameHypnoType {
  off = 'off',
  joi = 'joi',
  breeding = 'breeding',
  maledom = 'maledom',
  femdom = 'femdom',
}

export const GameHypnoLabels: Record<GameHypnoType, string> = {
  off: 'Off',
  joi: 'JOI',
  breeding: 'Breeding',
  maledom: 'Maledom Pet',
  femdom: 'Femdom Pet',
};

export const GameHypnoDescriptions: Record<GameHypnoType, string> = {
  off: 'Turn off the hypnosis all-together',
  joi: 'Focus on masturbation encouragement',
  breeding: 'Focus on breeding and primal urge',
  maledom: "Good pets get master's treats",
  femdom: "Good pets get mistress' treats",
};

export const HypnoPhrases: Record<GameHypnoType, string[]> = {
  off: [],
  joi: [
    '$part',
    '$part',
    '$stroke',
    '$stroke',
    '$stroke',
    "can't stop",
    'everyday',
    'give in',
    'goon',
    'hard',
    'horny',
    'instinct',
    'jack off',
    'leak',
    'masturbate',
    'must',
    'need',
    'ooze',
    'pre',
    'precum',
  ],
  breeding: [
    'breed',
    'breed',
    'breed',
    'deep',
    'fill',
    'fuck',
    'give in',
    'give in',
    'instinct',
    'instinct',
    'moan',
    'must',
    'ooze',
    'seed',
    'shoot',
    'sperm',
    'sperm',
  ],
  maledom: [
    '$stroke for master',
    '$stroke for master',
    'animal',
    'give in',
    'give master',
    'good $player',
    'good $player',
    'good $player',
    'good $player',
    'hump',
    'listen',
    'master',
    'master',
    "master's $part",
    "master's $part",
    "master's $part",
    "master's cum",
    'not your $part',
    'not your $part',
    'not your $part',
    'not your cum',
    'obey',
    'obey',
    'obey',
    'obey master',
    'only',
    'owner',
    'stare',
  ],
  femdom: [
    '$stroke for mistress',
    '$stroke for mistress',
    'animal',
    'give in',
    'give mistress',
    'good $player',
    'good $player',
    'good $player',
    'good $player',
    'hump',
    'listen',
    'mistress',
    'mistress',
    "mistress' $part",
    "mistress' $part",
    "mistress' $part",
    "mistress' cum",
    'not your $part',
    'not your $part',
    'not your $part',
    'not your cum',
    'obey',
    'obey',
    'obey',
    'obey mistress',
    'only',
    'owner',
    'stare',
  ],
};

const PLUGIN_ID = 'how.joi.classic.hypno';

export type HypnoState = {
  currentPhrase: number;
  timer: number;
};

const hypno = pluginPaths<HypnoState>(PLUGIN_ID);
const timing = typedPath<GameTiming>([]);
const phaseState = typedPath<PhaseState>(['how.joi.phase']);
const intensityState = typedPath<IntensityState>(['how.joi.classic.intensity']);
export const hypnoKeys = Presets.keys(PLUGIN_ID, {
  hypno: GameHypnoType.joi as GameHypnoType,
});

const Hypno = definePlugin({
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

      const s = hypnoKeys.get(get());
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

  get paths() {
    return hypno;
  },
});

export default Hypno;
