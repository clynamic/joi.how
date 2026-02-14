import { Composer } from '../../../engine/Composer';
import { typedPath } from '../../../engine/Lens';
import { Sequence } from '../../Sequence';
import Pace from '../pace';
import { DiceEvent } from '../../../types';
import {
  PLUGIN_ID,
  intensityState,
  settings,
  outcomeDone,
  DiceOutcome,
} from './types';

export const edged = typedPath<boolean>(['state', PLUGIN_ID, 'edged']);

const seq = Sequence.for(PLUGIN_ID, 'edge');

export const edgeOutcome: DiceOutcome = {
  id: DiceEvent.edge,
  check: frame => {
    const i = (Composer.get(intensityState)(frame)?.intensity ?? 0) * 100;
    return i >= 90 && !Composer.get(edged)(frame);
  },
  update: Composer.pipe(
    seq.on(() =>
      Composer.bind(settings, s =>
        Composer.pipe(
          Composer.set(edged, true),
          Pace.setPace(s.minPace),
          seq.message({
            title: `You should be getting close to the edge. Don't cum yet.`,
            duration: 10000,
          }),
          seq.after(10000, 'done')
        )
      )
    ),
    seq.on('done', () => outcomeDone())
  ),
};
