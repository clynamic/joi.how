import { Composer } from '../../../engine/Composer';
import { Events, getEventKey } from '../../../engine/pipes/Events';
import { Messages } from '../../../engine/pipes/Messages';
import { Scheduler, getScheduleKey } from '../../../engine/pipes/Scheduler';
import Pace from '../pace';
import { GameEvent as GameEventType } from '../../../types';
import { intensityToPaceRange, round } from '../../../utils';
import {
  PLUGIN_ID,
  intensityState,
  settings,
  setBusy,
  DiceOutcome,
} from './types';
import { doRandomPace } from './randomPace';

const ev = {
  risingPace: getEventKey(PLUGIN_ID, 'risingPace'),
  step: getEventKey(PLUGIN_ID, 'risingPace.step'),
  hold: getEventKey(PLUGIN_ID, 'risingPace.hold'),
  done: getEventKey(PLUGIN_ID, 'risingPace.done'),
};

const sched = {
  step: getScheduleKey(PLUGIN_ID, 'risingPace.step'),
  hold: getScheduleKey(PLUGIN_ID, 'risingPace.hold'),
  done: getScheduleKey(PLUGIN_ID, 'risingPace.done'),
};

export const risingPaceOutcome: DiceOutcome = {
  id: GameEventType.risingPace,
  check: intensity => intensity >= 30,
  scheduleKeys: Object.values(sched),
  pipes: Composer.pipe(
    Events.handle(ev.risingPace, () =>
      Composer.do(({ get, pipe }) => {
        const i = (get(intensityState)?.intensity ?? 0) * 100;
        const s = get(settings);
        if (!s) return;

        pipe(
          Messages.send({
            id: GameEventType.risingPace,
            title: 'Rising pace strokes!',
          })
        );

        const acceleration = Math.round(100 / Math.min(i, 35));
        const { max } = intensityToPaceRange(i, s.steepness, s.timeshift, {
          min: s.minPace,
          max: s.maxPace,
        });
        const portion = (max - s.minPace) / acceleration;

        pipe(Pace.setPace(s.minPace));
        pipe(
          Scheduler.schedule({
            id: sched.step,
            duration: 10000,
            event: {
              type: ev.step,
              payload: {
                current: s.minPace,
                portion,
                remaining: acceleration,
              },
            },
          })
        );
      })
    ),
    Events.handle(ev.step, event =>
      Composer.do(({ pipe }) => {
        const { current, portion, remaining } = event.payload;
        const newPace = round(current + portion);
        pipe(Pace.setPace(newPace));
        pipe(
          Messages.send({
            id: GameEventType.risingPace,
            title: `Pace rising to ${newPace}!`,
            duration: 5000,
          })
        );

        if (remaining <= 1) {
          pipe(
            Scheduler.schedule({
              id: sched.hold,
              duration: 10000,
              event: { type: ev.hold },
            })
          );
        } else {
          pipe(
            Scheduler.schedule({
              id: sched.step,
              duration: 10000,
              event: {
                type: ev.step,
                payload: {
                  current: newPace,
                  portion,
                  remaining: remaining - 1,
                },
              },
            })
          );
        }
      })
    ),
    Events.handle(ev.hold, () =>
      Composer.pipe(
        Messages.send({
          id: GameEventType.risingPace,
          title: 'Stay at this pace for a bit',
          duration: 5000,
        }),
        Scheduler.schedule({
          id: sched.done,
          duration: 15000,
          event: { type: ev.done },
        })
      )
    ),
    Events.handle(ev.done, () => Composer.pipe(doRandomPace(), setBusy(false)))
  ),
};
