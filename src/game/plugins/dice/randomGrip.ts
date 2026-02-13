import { Composer } from '../../../engine/Composer';
import { Events, getEventKey } from '../../../engine/pipes/Events';
import { Messages } from '../../../engine/pipes/Messages';
import { Scheduler, getScheduleKey } from '../../../engine/pipes/Scheduler';
import { GameEvent as GameEventType } from '../../../types';
import {
  PLUGIN_ID,
  dice,
  Paws,
  PawLabels,
  setBusy,
  DiceOutcome,
} from './types';

const ev = {
  randomGrip: getEventKey(PLUGIN_ID, 'randomGrip'),
  done: getEventKey(PLUGIN_ID, 'randomGrip.done'),
};

const sched = {
  done: getScheduleKey(PLUGIN_ID, 'randomGrip'),
};

export const randomGripOutcome: DiceOutcome = {
  id: GameEventType.randomGrip,
  check: () => true,
  scheduleKeys: Object.values(sched),
  pipes: Composer.pipe(
    Events.handle(ev.randomGrip, () =>
      Composer.do(({ get, set, pipe }) => {
        const state = get(dice.state);
        if (!state) return;
        const currentPaws = state.paws;
        let newPaws: Paws;
        const seed = Math.random();
        if (seed < 0.33)
          newPaws = currentPaws === Paws.both ? Paws.left : Paws.both;
        else if (seed < 0.66)
          newPaws = currentPaws === Paws.left ? Paws.right : Paws.left;
        else newPaws = currentPaws === Paws.right ? Paws.both : Paws.right;
        set(dice.state.paws, newPaws);
        pipe(
          Messages.send({
            id: GameEventType.randomGrip,
            title: `Grip changed to ${PawLabels[newPaws]}!`,
            duration: 5000,
          })
        );
        pipe(
          Scheduler.schedule({
            id: sched.done,
            duration: 10000,
            event: { type: ev.done },
          })
        );
      })
    ),
    Events.handle(ev.done, () => setBusy(false))
  ),
};
