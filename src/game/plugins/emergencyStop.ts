import type { Plugin } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { Scheduler } from '../../engine/pipes/Scheduler';
import { typedPath } from '../../engine/Lens';
import { Sequence } from '../Sequence';
import Phase, { GamePhase } from './phase';
import Pause from './pause';
import Pace from './pace';
import { IntensityState } from './intensity';
import { Settings } from '../../settings';

const PLUGIN_ID = 'core.emergencyStop';

const intensityState = typedPath<IntensityState>(['state', 'core.intensity']);
const settings = typedPath<Settings>(['context', 'settings']);

type CountdownPayload = { remaining: number };

const seq = Sequence.for(PLUGIN_ID, 'stop');

declare module '../../engine/sdk' {
  interface PluginSDK {
    EmergencyStop: typeof EmergencyStop;
  }
}

export default class EmergencyStop {
  static plugin: Plugin = {
    id: PLUGIN_ID,
    meta: {
      name: 'EmergencyStop',
    },

    update: Composer.pipe(
      seq.on(() =>
        Composer.bind(intensityState, ist =>
          Composer.bind(settings, s => {
            const i = (ist?.intensity ?? 0) * 100;
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

      seq.on('resume', () => Phase.setPhase(GamePhase.active)),

      Pause.onPause(() => Scheduler.holdByPrefix(PLUGIN_ID)),
      Pause.onResume(() => Scheduler.releaseByPrefix(PLUGIN_ID))
    ),
  };
}
