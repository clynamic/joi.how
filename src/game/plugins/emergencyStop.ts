import { definePlugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { typedPath } from '../../engine/Lens';
import { Pipe } from '../../engine/State';
import { Sequence } from '../Sequence';
import Phase, { GamePhase } from './phase';
import Pace from './pace';
import { IntensityState } from './intensity';
import { Settings } from '../../settings/Settings';

const PLUGIN_ID = 'core.emergency_stop';

const intensityState = typedPath<IntensityState>(['core.intensity']);
const settings = typedPath<Settings>(['settings']);

type CountdownPayload = { remaining: number };

const seq = Sequence.for(PLUGIN_ID, 'stop');

const EmergencyStop = definePlugin({
  sdk: 'EmergencyStop',
  id: PLUGIN_ID,
  meta: {
    name: 'EmergencyStop',
  },

  trigger(): Pipe {
    return Phase.whenPhase(GamePhase.active, seq.start());
  },

  update: Composer.pipe(
    seq.on(() =>
      Phase.whenPhase(
        GamePhase.active,
        Composer.bind(intensityState, ist =>
          Composer.bind(settings, s => {
            const i = ist.intensity * 100;
            const timeToCalmDown = Math.ceil((i * 500 + 10000) / 1000);
            return Composer.pipe(
              Phase.setPhase(GamePhase.break),
              seq.message({ title: 'Calm down with your $hands off.' }),
              Composer.over(intensityState, (st: IntensityState) => ({
                intensity: Math.max(0, st.intensity - 0.3),
              })),
              Pace.setPace(s.minPace),
              seq.after(5000, 'countdown', { remaining: timeToCalmDown })
            );
          })
        )
      )
    ),

    seq.on<CountdownPayload>('countdown', event => {
      const { remaining } = event.payload;
      if (remaining <= 0) {
        return Composer.pipe(
          seq.message({
            title: 'Put your $hands back.',
            description: undefined,
            duration: 5000,
          }),
          seq.after(2000, 'resume')
        );
      }
      return Composer.pipe(
        seq.message({ description: `${remaining}...` }),
        seq.after(1000, 'countdown', { remaining: remaining - 1 })
      );
    }),

    seq.on('resume', () => Phase.setPhase(GamePhase.active))
  ),
});

export default EmergencyStop;
