import { Composer } from '../../../engine/Composer';
import { Events, getEventKey } from '../../../engine/pipes/Events';
import { Messages } from '../../../engine/pipes/Messages';
import { Scheduler, getScheduleKey } from '../../../engine/pipes/Scheduler';
import { Pipe } from '../../../engine/State';
import Phase, { GamePhase } from '../phase';
import Pace from '../pace';
import { IntensityState } from '../intensity';
import { PLUGIN_ID, intensityState, settings, setBusy } from './types';

const ev = {
  emergencyStop: getEventKey(PLUGIN_ID, 'emergencyStop'),
  countdown: getEventKey(PLUGIN_ID, 'emergency.countdown'),
  resume: getEventKey(PLUGIN_ID, 'emergency.resume'),
};

const sched = {
  calm: getScheduleKey(PLUGIN_ID, 'emergency.calm'),
  countdown: getScheduleKey(PLUGIN_ID, 'emergency.countdown'),
  resume: getScheduleKey(PLUGIN_ID, 'emergency.resume'),
};

export const emergencyStopScheduleKeys: string[] = Object.values(sched);

export const emergencyStopPipes: Pipe = Composer.pipe(
  Events.handle(ev.emergencyStop, () =>
    Composer.do(({ get, pipe }) => {
      const s = get(settings);
      const i = (get(intensityState)?.intensity ?? 0) * 100;
      if (!s) return;

      const timeToCalmDown = Math.ceil((i * 500 + 10000) / 1000);

      pipe(Phase.setPhase(GamePhase.break));
      pipe(
        Messages.send({
          id: 'emergency-stop',
          title: 'Calm down with your $hands off.',
        })
      );
      pipe(
        Composer.over(intensityState, (st: IntensityState) => ({
          intensity: Math.max(0, st.intensity - 0.3),
        }))
      );
      pipe(Pace.setPace(s.minPace));
      pipe(
        Scheduler.schedule({
          id: sched.calm,
          duration: 5000,
          event: {
            type: ev.countdown,
            payload: { remaining: timeToCalmDown },
          },
        })
      );
    })
  ),

  Events.handle(ev.countdown, event =>
    Composer.do(({ pipe }) => {
      const { remaining } = event.payload;
      if (remaining <= 0) {
        pipe(
          Messages.send({
            id: 'emergency-stop',
            title: 'Put your $hands back.',
            description: undefined,
            duration: 5000,
          })
        );
        pipe(
          Scheduler.schedule({
            id: sched.resume,
            duration: 2000,
            event: { type: ev.resume },
          })
        );
      } else {
        pipe(
          Messages.send({
            id: 'emergency-stop',
            description: `${remaining}...`,
          })
        );
        pipe(
          Scheduler.schedule({
            id: sched.countdown,
            duration: 1000,
            event: {
              type: ev.countdown,
              payload: { remaining: remaining - 1 },
            },
          })
        );
      }
    })
  ),

  Events.handle(ev.resume, () =>
    Composer.pipe(Phase.setPhase(GamePhase.active), setBusy(false))
  )
);
