import { Composer } from '../../../engine/Composer';
import { Events, getEventKey } from '../../../engine/pipes/Events';
import { Messages } from '../../../engine/pipes/Messages';
import { Scheduler, getScheduleKey } from '../../../engine/pipes/Scheduler';
import { Pipe } from '../../../engine/State';
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

const ev = {
  randomPace: getEventKey(PLUGIN_ID, 'randomPace'),
  done: getEventKey(PLUGIN_ID, 'randomPace.done'),
};

const sched = {
  randomPace: getScheduleKey(PLUGIN_ID, 'randomPace'),
};

export const doRandomPace = (): Pipe =>
  Composer.do(({ get, pipe }) => {
    const i = get(intensityState)?.intensity ?? 0;
    const s = get(settings);
    if (!s) return;
    const { min, max } = intensityToPaceRange(
      i * 100,
      s.steepness,
      s.timeshift,
      { min: s.minPace, max: s.maxPace }
    );
    const newPace = round(Math.random() * (max - min) + min);
    pipe(Pace.setPace(newPace));
    pipe(
      Messages.send({
        id: GameEventType.randomPace,
        title: `Pace changed to ${newPace}!`,
        duration: 5000,
      })
    );
  });

export const randomPaceOutcome: DiceOutcome = {
  id: GameEventType.randomPace,
  check: () => true,
  scheduleKeys: Object.values(sched),
  pipes: Composer.pipe(
    Events.handle(ev.randomPace, () =>
      Composer.pipe(
        doRandomPace(),
        Scheduler.schedule({
          id: sched.randomPace,
          duration: 9000,
          event: { type: ev.done },
        })
      )
    ),
    Events.handle(ev.done, () => setBusy(false))
  ),
};
