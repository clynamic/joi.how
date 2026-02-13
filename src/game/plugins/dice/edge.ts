import { Composer } from '../../../engine/Composer';
import { Events, getEventKey } from '../../../engine/pipes/Events';
import { Messages } from '../../../engine/pipes/Messages';
import { Scheduler, getScheduleKey } from '../../../engine/pipes/Scheduler';
import Pace from '../pace';
import { GameEvent as GameEventType } from '../../../types';
import { PLUGIN_ID, dice, settings, setBusy, DiceOutcome } from './types';

const ev = {
  edge: getEventKey(PLUGIN_ID, 'edge'),
  done: getEventKey(PLUGIN_ID, 'edge.done'),
};

const sched = {
  edge: getScheduleKey(PLUGIN_ID, 'edge'),
};

export const edgeOutcome: DiceOutcome = {
  id: GameEventType.edge,
  check: (intensity, edged) => intensity >= 90 && !edged,
  scheduleKeys: Object.values(sched),
  pipes: Composer.pipe(
    Events.handle(ev.edge, () =>
      Composer.do(({ get, set, pipe }) => {
        const s = get(settings);
        if (!s) return;
        set(dice.state.edged, true);
        pipe(Pace.setPace(s.minPace));
        pipe(
          Messages.send({
            id: GameEventType.edge,
            title: `You should be getting close to the edge. Don't cum yet.`,
            duration: 10000,
          })
        );
        pipe(
          Scheduler.schedule({
            id: sched.edge,
            duration: 10000,
            event: { type: ev.done },
          })
        );
      })
    ),
    Events.handle(ev.done, () => setBusy(false))
  ),
};
