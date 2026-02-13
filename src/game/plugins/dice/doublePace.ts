import { Composer } from '../../../engine/Composer';
import { Events, getEventKey } from '../../../engine/pipes/Events';
import { Messages } from '../../../engine/pipes/Messages';
import { Scheduler, getScheduleKey } from '../../../engine/pipes/Scheduler';
import Pace from '../pace';
import { GameEvent as GameEventType } from '../../../types';
import { round } from '../../../utils';
import { PLUGIN_ID, paceState, settings, setBusy, DiceOutcome } from './types';
import { doRandomPace } from './randomPace';

const ev = {
  doublePace: getEventKey(PLUGIN_ID, 'doublePace'),
  step2: getEventKey(PLUGIN_ID, 'doublePace.2'),
  step3: getEventKey(PLUGIN_ID, 'doublePace.3'),
  done: getEventKey(PLUGIN_ID, 'doublePace.done'),
};

const sched = {
  step2: getScheduleKey(PLUGIN_ID, 'doublePace.2'),
  step3: getScheduleKey(PLUGIN_ID, 'doublePace.3'),
  done: getScheduleKey(PLUGIN_ID, 'doublePace.done'),
};

export const doublePaceOutcome: DiceOutcome = {
  id: GameEventType.doublePace,
  check: intensity => intensity >= 20,
  scheduleKeys: Object.values(sched),
  pipes: Composer.pipe(
    Events.handle(ev.doublePace, () =>
      Composer.do(({ get, pipe }) => {
        const pace = get(paceState)?.pace ?? 1;
        const s = get(settings);
        if (!s) return;
        const newPace = Math.min(round(pace * 2), s.maxPace);
        pipe(Pace.setPace(newPace));
        pipe(
          Messages.send({
            id: GameEventType.doublePace,
            title: 'Double pace!',
            description: '3...',
          })
        );
        pipe(
          Scheduler.schedule({
            id: sched.step2,
            duration: 3000,
            event: { type: ev.step2 },
          })
        );
      })
    ),
    Events.handle(ev.step2, () =>
      Composer.pipe(
        Messages.send({
          id: GameEventType.doublePace,
          description: '2...',
        }),
        Scheduler.schedule({
          id: sched.step3,
          duration: 3000,
          event: { type: ev.step3 },
        })
      )
    ),
    Events.handle(ev.step3, () =>
      Composer.pipe(
        Messages.send({
          id: GameEventType.doublePace,
          description: '1...',
        }),
        Scheduler.schedule({
          id: sched.done,
          duration: 3000,
          event: { type: ev.done },
        })
      )
    ),
    Events.handle(ev.done, () =>
      Composer.pipe(
        Messages.send({
          id: GameEventType.doublePace,
          title: 'Done! Back to normal pace',
          description: undefined,
          duration: 5000,
        }),
        doRandomPace(),
        setBusy(false)
      )
    )
  ),
};
