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
  halfPace: getEventKey(PLUGIN_ID, 'halfPace'),
  step2: getEventKey(PLUGIN_ID, 'halfPace.2'),
  step3: getEventKey(PLUGIN_ID, 'halfPace.3'),
  done: getEventKey(PLUGIN_ID, 'halfPace.done'),
};

const sched = {
  step2: getScheduleKey(PLUGIN_ID, 'halfPace.2'),
  step3: getScheduleKey(PLUGIN_ID, 'halfPace.3'),
  done: getScheduleKey(PLUGIN_ID, 'halfPace.done'),
};

export const halfPaceOutcome: DiceOutcome = {
  id: GameEventType.halfPace,
  check: intensity => intensity >= 10 && intensity <= 50,
  scheduleKeys: Object.values(sched),
  pipes: Composer.pipe(
    Events.handle(ev.halfPace, () =>
      Composer.do(({ get, pipe }) => {
        const pace = get(paceState)?.pace ?? 1;
        const s = get(settings);
        if (!s) return;
        const newPace = Math.max(round(pace / 2), s.minPace);
        pipe(Pace.setPace(newPace));
        const duration = Math.ceil(Math.random() * 20000) + 12000;
        const portion = duration / 3;
        pipe(
          Messages.send({
            id: GameEventType.halfPace,
            title: 'Half pace!',
            description: '3...',
          })
        );
        pipe(
          Scheduler.schedule({
            id: sched.step2,
            duration: portion,
            event: { type: ev.step2, payload: { portion } },
          })
        );
      })
    ),
    Events.handle(ev.step2, event =>
      Composer.pipe(
        Messages.send({
          id: GameEventType.halfPace,
          description: '2...',
        }),
        Scheduler.schedule({
          id: sched.step3,
          duration: event.payload.portion,
          event: { type: ev.step3, payload: event.payload },
        })
      )
    ),
    Events.handle(ev.step3, event =>
      Composer.pipe(
        Messages.send({
          id: GameEventType.halfPace,
          description: '1...',
        }),
        Scheduler.schedule({
          id: sched.done,
          duration: event.payload.portion,
          event: { type: ev.done },
        })
      )
    ),
    Events.handle(ev.done, () =>
      Composer.pipe(
        Messages.send({
          id: GameEventType.halfPace,
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
